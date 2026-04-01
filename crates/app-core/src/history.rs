use domain_core::command::AppliedCommand;
use serde::{Deserialize, Serialize};

/// Deterministic command history supporting undo and redo.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct CommandHistory {
    undo_stack: Vec<AppliedCommand>,
    redo_stack: Vec<AppliedCommand>,
}

impl CommandHistory {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push(&mut self, command: AppliedCommand) {
        self.undo_stack.push(command);
        self.redo_stack.clear();
    }

    pub fn pop_undo(&mut self) -> Option<AppliedCommand> {
        self.undo_stack.pop()
    }

    pub fn push_redo(&mut self, command: AppliedCommand) {
        self.redo_stack.push(command);
    }

    pub fn pop_redo(&mut self) -> Option<AppliedCommand> {
        self.redo_stack.pop()
    }

    #[must_use]
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    #[must_use]
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    #[must_use]
    pub fn undo_len(&self) -> usize {
        self.undo_stack.len()
    }

    #[must_use]
    pub fn redo_len(&self) -> usize {
        self.redo_stack.len()
    }
}
