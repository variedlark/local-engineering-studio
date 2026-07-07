use crate::bundle::{BundleError, ProjectBundleStore};
use crate::project::ProjectSession;
use crate::{analyze_drc, analyze_route, analyze_simulation};
use domain_core::DomainValidationError;
use domain_core::command::{AppliedCommand, DomainCommand};
use engine_drc::DrcReport;
use engine_routing::RouteResult;
use engine_simulation::{SimulationConfig, SimulationReport};
use foundation_core::{CoreErrorCode, ProjectId, unix_millis_now};
use indexmap::IndexMap;
use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("session not found")]
    SessionNotFound,
    #[error("domain validation failed: {0}")]
    DomainValidation(#[from] DomainValidationError),
    #[error("persistence failure: {0}")]
    Persistence(#[from] BundleError),
    #[error("analysis failure: {0}")]
    Analysis(String),
}

impl AppError {
    #[must_use]
    pub fn error_code(&self) -> CoreErrorCode {
        match self {
            Self::SessionNotFound => CoreErrorCode::NotFound,
            Self::DomainValidation(err) => err.code,
            Self::Persistence(_) => CoreErrorCode::Storage,
            Self::Analysis(_) => CoreErrorCode::Validation,
        }
    }
}

#[derive(Debug, Default)]
pub struct AppService {
    sessions: IndexMap<ProjectId, ProjectSession>,
}

#[derive(Debug, Clone)]
pub struct OpenProjectEntry {
    pub project_id: ProjectId,
    pub session: ProjectSession,
}

impl AppService {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create_project(&mut self, name: impl Into<String>) -> ProjectId {
        let session = ProjectSession::new(name);
        let project_id = session.project_id();
        let _replaced = self.sessions.insert(project_id, session);
        project_id
    }

    pub fn insert_session(&mut self, session: ProjectSession) -> ProjectId {
        let project_id = session.project_id();
        let _replaced = self.sessions.insert(project_id, session);
        project_id
    }

    pub fn open_project(
        &mut self,
        project_id: ProjectId,
        bundle_root: impl Into<PathBuf>,
    ) -> Result<ProjectId, AppError> {
        let store = ProjectBundleStore::new(bundle_root);
        let session = store.recover_or_load(project_id)?;
        let _replaced = self.sessions.insert(project_id, session);
        Ok(project_id)
    }

    pub fn save_project(
        &mut self,
        project_id: ProjectId,
        bundle_root: impl Into<PathBuf>,
    ) -> Result<PathBuf, AppError> {
        let session = self.sessions.get_mut(&project_id).ok_or(AppError::SessionNotFound)?;
        let store = ProjectBundleStore::new(bundle_root);
        let path = store.save_session(session)?;
        session.dirty = false;
        Ok(path)
    }

    pub fn autosave_project(
        &mut self,
        project_id: ProjectId,
        bundle_root: impl Into<PathBuf>,
    ) -> Result<PathBuf, AppError> {
        let session = self.sessions.get_mut(&project_id).ok_or(AppError::SessionNotFound)?;
        let store = ProjectBundleStore::new(bundle_root);
        let path = store.autosave_session(session)?;
        let revision = session.model.meta.revision;
        let keep_from = revision.saturating_sub(500);
        session.truncate_journal_before_revision(keep_from);
        session.mark_autosaved(unix_millis_now());
        Ok(path)
    }

    pub fn execute(
        &mut self,
        project_id: ProjectId,
        command: DomainCommand,
    ) -> Result<AppliedCommand, AppError> {
        let session = self.sessions.get_mut(&project_id).ok_or(AppError::SessionNotFound)?;
        let applied = session.execute(command)?;
        Ok(applied)
    }

    pub fn undo(&mut self, project_id: ProjectId) -> Result<bool, AppError> {
        let session = self.sessions.get_mut(&project_id).ok_or(AppError::SessionNotFound)?;
        session.undo().map_err(AppError::from)
    }

    pub fn redo(&mut self, project_id: ProjectId) -> Result<bool, AppError> {
        let session = self.sessions.get_mut(&project_id).ok_or(AppError::SessionNotFound)?;
        session.redo().map_err(AppError::from)
    }

    pub fn session(&self, project_id: ProjectId) -> Option<&ProjectSession> {
        self.sessions.get(&project_id)
    }

    pub fn close_project(&mut self, project_id: ProjectId) -> bool {
        self.sessions.shift_remove(&project_id).is_some()
    }

    pub fn sessions_iter(&self) -> impl Iterator<Item = OpenProjectEntry> + '_ {
        self.sessions.iter().map(|(project_id, session)| OpenProjectEntry {
            project_id: *project_id,
            session: session.clone(),
        })
    }

    pub fn drc_report(&self, project_id: ProjectId) -> Result<DrcReport, AppError> {
        let session = self.sessions.get(&project_id).ok_or(AppError::SessionNotFound)?;
        Ok(analyze_drc(&session.model))
    }

    pub fn simulation_report(
        &self,
        project_id: ProjectId,
        config: SimulationConfig,
    ) -> Result<SimulationReport, AppError> {
        let session = self.sessions.get(&project_id).ok_or(AppError::SessionNotFound)?;
        Ok(analyze_simulation(&session.model, config))
    }

    pub fn route_report(
        &self,
        project_id: ProjectId,
        from: foundation_core::ComponentId,
        to: foundation_core::ComponentId,
    ) -> Result<RouteResult, AppError> {
        let session = self.sessions.get(&project_id).ok_or(AppError::SessionNotFound)?;
        analyze_route(&session.model, from, to)
            .map_err(|error| AppError::Analysis(error.to_string()))
    }
}
