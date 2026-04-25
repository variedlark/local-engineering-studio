use crate::command::DomainCommand;
use crate::model::DomainModel;
use foundation_core::{ComponentId, CoreError, CoreErrorCode};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, thiserror::Error, Serialize, Deserialize)]
#[error("{message}")]
pub struct DomainValidationError {
    pub code: CoreErrorCode,
    pub message: String,
}

impl DomainValidationError {
    #[must_use]
    pub fn component_not_found(component_id: ComponentId) -> Self {
        Self {
            code: CoreErrorCode::NotFound,
            message: format!("Component {component_id} does not exist"),
        }
    }

    #[must_use]
    pub fn conflict(message: impl Into<String>) -> Self {
        Self { code: CoreErrorCode::Conflict, message: message.into() }
    }

    #[must_use]
    pub fn validation(message: impl Into<String>) -> Self {
        Self { code: CoreErrorCode::Validation, message: message.into() }
    }
}

impl From<CoreError> for DomainValidationError {
    fn from(value: CoreError) -> Self {
        Self { code: value.code, message: value.message }
    }
}

pub fn validate_command(
    model: &DomainModel,
    command: &DomainCommand,
) -> Result<(), DomainValidationError> {
    match command {
        DomainCommand::PlaceComponent { component_id, name, position: _ } => {
            if name.trim().is_empty() {
                return Err(DomainValidationError::validation("Component name cannot be empty"));
            }
            if model.components.contains_key(component_id) {
                return Err(DomainValidationError::conflict("Component id already exists"));
            }
        }
        DomainCommand::MoveComponent { component_id, to: _ } => {
            if !model.components.contains_key(component_id) {
                return Err(DomainValidationError::component_not_found(*component_id));
            }
        }
        DomainCommand::RenameComponent { component_id, name } => {
            if !model.components.contains_key(component_id) {
                return Err(DomainValidationError::component_not_found(*component_id));
            }
            if name.trim().is_empty() {
                return Err(DomainValidationError::validation("Component name cannot be empty"));
            }
            if model.components.iter().any(|(id, component)| {
                id != component_id && component.name.eq_ignore_ascii_case(name)
            }) {
                return Err(DomainValidationError::conflict(
                    "Another component already has this name",
                ));
            }
        }
        DomainCommand::RenameProject { name } => {
            if name.trim().is_empty() {
                return Err(DomainValidationError::validation("Project name cannot be empty"));
            }
        }
        DomainCommand::SetComponentLayer { component_id, layer } => {
            if !model.components.contains_key(component_id) {
                return Err(DomainValidationError::component_not_found(*component_id));
            }
            if !(-32..=32).contains(layer) {
                return Err(DomainValidationError::validation(
                    "Component layer must be between -32 and 32",
                ));
            }
        }
        DomainCommand::SetRules { min_spacing_um, grid_step_um } => {
            if *min_spacing_um <= 0 {
                return Err(DomainValidationError::validation(
                    "Minimum spacing must be greater than zero",
                ));
            }
            if *grid_step_um <= 0 {
                return Err(DomainValidationError::validation(
                    "Grid step must be greater than zero",
                ));
            }
            if min_spacing_um % grid_step_um != 0 {
                return Err(DomainValidationError::validation(
                    "Minimum spacing must be an integer multiple of grid step",
                ));
            }
        }
        DomainCommand::DeleteComponent { component_id } => {
            if !model.components.contains_key(component_id) {
                return Err(DomainValidationError::component_not_found(*component_id));
            }
        }
        DomainCommand::Batch { label, commands } => {
            if label.trim().is_empty() {
                return Err(DomainValidationError::validation(
                    "Batch command label cannot be empty",
                ));
            }
            if commands.is_empty() {
                return Err(DomainValidationError::validation("Batch command cannot be empty"));
            }
            let mut dry_run = model.clone();
            for command in commands {
                validate_command(&dry_run, command)?;
                let _applied = command.clone().apply(&mut dry_run, "validator")?;
            }
        }
    }

    Ok(())
}
