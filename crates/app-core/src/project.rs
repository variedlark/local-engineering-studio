use crate::history::CommandHistory;
use domain_core::command::{AppliedCommand, DomainCommand, DomainPatch};
use domain_core::{DomainModel, DomainValidationError};
use foundation_core::{ProjectId, unix_millis_now};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSnapshot {
    pub model: DomainModel,
    pub history: CommandHistory,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone)]
pub struct ProjectSession {
    pub model: DomainModel,
    pub history: CommandHistory,
    pub journal: Vec<JournalEntry>,
    pub dirty: bool,
    pub last_autosave_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub revision_after: u64,
    pub command: DomainCommand,
    pub patch: DomainPatch,
    pub recorded_at_ms: u64,
}

impl ProjectSession {
    #[must_use]
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            model: DomainModel::new(name),
            history: CommandHistory::new(),
            journal: Vec::new(),
            dirty: true,
            last_autosave_ms: None,
        }
    }

    #[must_use]
    pub fn from_snapshot(snapshot: SessionSnapshot) -> Self {
        Self {
            model: snapshot.model,
            history: snapshot.history,
            journal: Vec::new(),
            dirty: false,
            last_autosave_ms: Some(snapshot.updated_at_ms),
        }
    }

    #[must_use]
    pub fn to_snapshot(&self) -> SessionSnapshot {
        SessionSnapshot {
            model: self.model.clone(),
            history: self.history.clone(),
            updated_at_ms: unix_millis_now(),
        }
    }

    #[must_use]
    pub fn project_id(&self) -> ProjectId {
        self.model.meta.project_id
    }

    pub fn execute(
        &mut self,
        command: DomainCommand,
    ) -> Result<AppliedCommand, DomainValidationError> {
        let applied = command.apply(&mut self.model, "local_user")?;
        self.history.push(applied.clone());
        self.journal.push(JournalEntry {
            revision_after: applied.revision_after,
            command: applied.command.clone(),
            patch: applied.patch.clone(),
            recorded_at_ms: unix_millis_now(),
        });
        self.dirty = true;
        Ok(applied)
    }

    pub fn undo(&mut self) -> Result<bool, DomainValidationError> {
        let Some(applied) = self.history.pop_undo() else {
            return Ok(false);
        };

        let redo_record = applied.clone();
        applied.undo(&mut self.model, "local_user")?;
        self.history.push_redo(redo_record);
        self.dirty = true;
        Ok(true)
    }

    pub fn redo(&mut self) -> Result<bool, DomainValidationError> {
        let Some(applied) = self.history.pop_redo() else {
            return Ok(false);
        };

        self.reapply(applied)
    }

    pub fn mark_autosaved(&mut self, at_ms: u64) {
        self.last_autosave_ms = Some(at_ms);
        self.dirty = false;
    }

    fn reapply(&mut self, applied: AppliedCommand) -> Result<bool, DomainValidationError> {
        let replayed = applied.redo(&mut self.model, "local_user")?;
        self.history.push(replayed);
        self.dirty = true;
        Ok(true)
    }

    pub fn truncate_journal_before_revision(&mut self, min_revision: u64) {
        self.journal.retain(|entry| entry.revision_after >= min_revision);
    }
}
