use crate::project::{JournalEntry, ProjectSession, SessionSnapshot};
use foundation_core::{ProjectId, unix_millis_now};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

pub const MANIFEST_FILE: &str = "manifest.json";
pub const SNAPSHOT_FILE: &str = "snapshot.json";
pub const AUTOSAVE_FILE: &str = "autosave/journal.json";
pub const COMMAND_JOURNAL_FILE: &str = "autosave/command-log.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectManifest {
    pub project_id: ProjectId,
    pub name: String,
    pub format_major: u32,
    pub format_minor: u32,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub revision: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutosaveJournal {
    pub project_id: ProjectId,
    pub updated_at_ms: u64,
    pub snapshot: SessionSnapshot,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandJournal {
    pub project_id: ProjectId,
    pub updated_at_ms: u64,
    pub entries: Vec<JournalEntry>,
}

#[derive(Debug, thiserror::Error)]
pub enum BundleError {
    #[error("io failure: {0}")]
    Io(#[from] std::io::Error),
    #[error("json failure: {0}")]
    Json(#[from] serde_json::Error),
    #[error("project not found: {0}")]
    NotFound(PathBuf),
    #[error("manifest project id mismatch")]
    ProjectIdMismatch,
}

pub struct ProjectBundleStore {
    root: PathBuf,
}

impl ProjectBundleStore {
    #[must_use]
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn create_bundle(&self, session: &ProjectSession) -> Result<PathBuf, BundleError> {
        let bundle_dir = self.bundle_path(session.project_id());
        fs::create_dir_all(bundle_dir.join("autosave"))?;
        fs::create_dir_all(bundle_dir.join("backups"))?;
        fs::create_dir_all(bundle_dir.join("cache"))?;
        fs::create_dir_all(bundle_dir.join("assets"))?;
        self.write_snapshot(&bundle_dir, session)?;
        self.write_manifest(&bundle_dir, session)?;
        Ok(bundle_dir)
    }

    pub fn save_session(&self, session: &ProjectSession) -> Result<PathBuf, BundleError> {
        let bundle_dir = self.bundle_path(session.project_id());
        if !bundle_dir.exists() {
            fs::create_dir_all(bundle_dir.join("autosave"))?;
            fs::create_dir_all(bundle_dir.join("backups"))?;
            fs::create_dir_all(bundle_dir.join("cache"))?;
            fs::create_dir_all(bundle_dir.join("assets"))?;
        }
        self.write_snapshot(&bundle_dir, session)?;
        self.write_manifest(&bundle_dir, session)?;
        Ok(bundle_dir)
    }

    pub fn autosave_session(&self, session: &ProjectSession) -> Result<PathBuf, BundleError> {
        let bundle_dir = self.save_session(session)?;
        let journal = AutosaveJournal {
            project_id: session.project_id(),
            updated_at_ms: unix_millis_now(),
            snapshot: session.to_snapshot(),
        };
        let content = serde_json::to_string_pretty(&journal)?;
        fs::write(bundle_dir.join(AUTOSAVE_FILE), content)?;

        let command_journal = CommandJournal {
            project_id: session.project_id(),
            updated_at_ms: unix_millis_now(),
            entries: session.journal.clone(),
        };
        let journal_content = serde_json::to_string_pretty(&command_journal)?;
        fs::write(bundle_dir.join(COMMAND_JOURNAL_FILE), journal_content)?;
        Ok(bundle_dir)
    }

    pub fn load_session(&self, project_id: ProjectId) -> Result<ProjectSession, BundleError> {
        let bundle_dir = self.bundle_path(project_id);
        if !bundle_dir.exists() {
            return Err(BundleError::NotFound(bundle_dir));
        }
        let manifest = self.read_manifest(&bundle_dir)?;
        if manifest.project_id != project_id {
            return Err(BundleError::ProjectIdMismatch);
        }

        let snapshot_path = bundle_dir.join(SNAPSHOT_FILE);
        let snapshot_json = fs::read_to_string(snapshot_path)?;
        let snapshot = serde_json::from_str::<SessionSnapshot>(&snapshot_json)?;
        let mut session = ProjectSession::from_snapshot(snapshot);
        session.model.meta.name = manifest.name;
        session.model.meta.format_major = manifest.format_major;
        session.model.meta.format_minor = manifest.format_minor;
        session.model.meta.created_at_ms = manifest.created_at_ms;
        session.model.meta.updated_at_ms = manifest.updated_at_ms;
        session.model.meta.revision = manifest.revision;
        Ok(session)
    }

    pub fn recover_or_load(&self, project_id: ProjectId) -> Result<ProjectSession, BundleError> {
        let bundle_dir = self.bundle_path(project_id);
        let autosave_path = bundle_dir.join(AUTOSAVE_FILE);
        if autosave_path.exists() {
            let content = fs::read_to_string(&autosave_path)?;
            let journal = serde_json::from_str::<AutosaveJournal>(&content)?;
            if journal.project_id == project_id {
                let mut session = ProjectSession::from_snapshot(journal.snapshot);
                let command_path = bundle_dir.join(COMMAND_JOURNAL_FILE);
                if command_path.exists() {
                    let command_content = fs::read_to_string(command_path)?;
                    let command_journal = serde_json::from_str::<CommandJournal>(&command_content)?;
                    if command_journal.project_id == project_id {
                        session.journal = command_journal.entries;
                    }
                }
                return Ok(session);
            }
        }
        self.load_session(project_id)
    }

    pub fn remove_autosave(&self, project_id: ProjectId) -> Result<(), BundleError> {
        let autosave_path = self.bundle_path(project_id).join(AUTOSAVE_FILE);
        let command_path = self.bundle_path(project_id).join(COMMAND_JOURNAL_FILE);
        match fs::remove_file(autosave_path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
            Err(error) => Err(BundleError::Io(error)),
        }
        .and_then(|_| match fs::remove_file(command_path) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
            Err(error) => Err(BundleError::Io(error)),
        })
    }

    pub fn validate_bundle(&self, project_id: ProjectId) -> Result<(), BundleError> {
        let bundle_dir = self.bundle_path(project_id);
        let manifest = self.read_manifest(&bundle_dir)?;
        if manifest.project_id != project_id {
            return Err(BundleError::ProjectIdMismatch);
        }
        let snapshot_path = bundle_dir.join(SNAPSHOT_FILE);
        let snapshot_json = fs::read_to_string(snapshot_path)?;
        let snapshot = serde_json::from_str::<SessionSnapshot>(&snapshot_json)?;
        if snapshot.model.meta.project_id != project_id {
            return Err(BundleError::ProjectIdMismatch);
        }
        Ok(())
    }

    fn write_snapshot(
        &self,
        bundle_dir: &Path,
        session: &ProjectSession,
    ) -> Result<(), BundleError> {
        let snapshot = session.to_snapshot();
        let content = serde_json::to_string_pretty(&snapshot)?;
        fs::write(bundle_dir.join(SNAPSHOT_FILE), content)?;
        Ok(())
    }

    fn write_manifest(
        &self,
        bundle_dir: &Path,
        session: &ProjectSession,
    ) -> Result<(), BundleError> {
        let manifest = ProjectManifest {
            project_id: session.project_id(),
            name: session.model.meta.name.clone(),
            format_major: session.model.meta.format_major,
            format_minor: session.model.meta.format_minor,
            created_at_ms: session.model.meta.created_at_ms,
            updated_at_ms: session.model.meta.updated_at_ms,
            revision: session.model.meta.revision,
        };
        let content = serde_json::to_string_pretty(&manifest)?;
        fs::write(bundle_dir.join(MANIFEST_FILE), content)?;
        Ok(())
    }

    fn read_manifest(&self, bundle_dir: &Path) -> Result<ProjectManifest, BundleError> {
        let content = fs::read_to_string(bundle_dir.join(MANIFEST_FILE))?;
        Ok(serde_json::from_str(&content)?)
    }

    fn bundle_path(&self, project_id: ProjectId) -> PathBuf {
        self.root.join(project_id.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_dir() -> PathBuf {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
        std::env::temp_dir().join(format!("local_studio_bundle_{nanos}"))
    }

    #[test]
    fn saves_and_recovers_bundle() {
        let root = test_dir();
        let store = ProjectBundleStore::new(&root);
        let mut session = ProjectSession::new("bundle-test");
        session.model.touch_revision();

        let _bundle = store.save_session(&session).expect("save bundle");
        let _autosave = store.autosave_session(&session).expect("autosave");

        let recovered = store.recover_or_load(session.project_id()).expect("recover session");
        assert_eq!(recovered.model.meta.project_id, session.model.meta.project_id);
        assert_eq!(recovered.journal.len(), session.journal.len());

        let _cleanup = fs::remove_dir_all(root);
    }
}
