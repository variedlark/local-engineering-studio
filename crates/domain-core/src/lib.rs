//! Canonical domain model, commands, and invariants.

pub mod command;
pub mod model;
pub mod validation;

pub use command::{AppliedCommand, DomainCommand, DomainPatch};
pub use model::{Component, DomainModel, Net, ProjectMeta, RuleSet};
pub use validation::DomainValidationError;
