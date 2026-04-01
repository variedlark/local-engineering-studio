use crate::model::{Component, DomainModel, RuleSet};
use crate::validation::{self, DomainValidationError};
use foundation_core::{CommandId, ComponentId, Point2i};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum DomainCommand {
    PlaceComponent { component_id: ComponentId, name: String, position: Point2i },
    MoveComponent { component_id: ComponentId, to: Point2i },
    RenameComponent { component_id: ComponentId, name: String },
    RenameProject { name: String },
    SetComponentLayer { component_id: ComponentId, layer: i32 },
    SetRules { min_spacing_um: i64, grid_step_um: i64 },
    DeleteComponent { component_id: ComponentId },
    Batch { label: String, commands: Vec<DomainCommand> },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DomainPatch {
    AddedComponent(Component),
    MovedComponent { component_id: ComponentId, from: Point2i, to: Point2i },
    RenamedComponent { component_id: ComponentId, from: String, to: String },
    ProjectRenamed { from: String, to: String },
    LayerChanged { component_id: ComponentId, from: i32, to: i32 },
    RulesChanged { from: RuleSet, to: RuleSet },
    RemovedComponent(Component),
    Composite(Vec<DomainPatch>),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppliedCommand {
    pub command_id: CommandId,
    pub command: DomainCommand,
    pub patch: DomainPatch,
    pub revision_after: u64,
}

impl DomainCommand {
    pub fn apply(self, model: &mut DomainModel) -> Result<AppliedCommand, DomainValidationError> {
        validation::validate_command(model, &self)?;

        let patch = match &self {
            Self::PlaceComponent { component_id, name, position } => {
                let component = Component {
                    id: *component_id,
                    name: name.clone(),
                    position: *position,
                    layer: 0,
                };
                let _replaced = model.components.insert(component.id, component.clone());
                DomainPatch::AddedComponent(component)
            }
            Self::MoveComponent { component_id, to } => {
                let component = model
                    .components
                    .get_mut(component_id)
                    .ok_or(DomainValidationError::component_not_found(*component_id))?;
                let from = component.position;
                component.position = *to;
                DomainPatch::MovedComponent { component_id: *component_id, from, to: *to }
            }
            Self::RenameComponent { component_id, name } => {
                let component = model
                    .components
                    .get_mut(component_id)
                    .ok_or(DomainValidationError::component_not_found(*component_id))?;
                let from = component.name.clone();
                component.name = name.clone();
                DomainPatch::RenamedComponent {
                    component_id: *component_id,
                    from,
                    to: name.clone(),
                }
            }
            Self::RenameProject { name } => {
                let from = model.meta.name.clone();
                model.meta.name = name.clone();
                DomainPatch::ProjectRenamed { from, to: name.clone() }
            }
            Self::SetComponentLayer { component_id, layer } => {
                let component = model
                    .components
                    .get_mut(component_id)
                    .ok_or(DomainValidationError::component_not_found(*component_id))?;
                let from = component.layer;
                component.layer = *layer;
                DomainPatch::LayerChanged { component_id: *component_id, from, to: *layer }
            }
            Self::SetRules { min_spacing_um, grid_step_um } => {
                let from = model.rules.clone();
                let to = RuleSet { min_spacing_um: *min_spacing_um, grid_step_um: *grid_step_um };
                model.rules = to.clone();
                DomainPatch::RulesChanged { from, to }
            }
            Self::DeleteComponent { component_id } => {
                let removed = model
                    .components
                    .shift_remove(component_id)
                    .ok_or(DomainValidationError::component_not_found(*component_id))?;
                DomainPatch::RemovedComponent(removed)
            }
            Self::Batch { label: _, commands } => {
                let mut patches = Vec::with_capacity(commands.len());
                for command in commands {
                    let applied = command.clone().apply(model)?;
                    patches.push(applied.patch);
                }
                DomainPatch::Composite(patches)
            }
        };

        model.touch_revision();

        Ok(AppliedCommand {
            command_id: CommandId::new(),
            command: self,
            patch,
            revision_after: model.meta.revision,
        })
    }
}

impl AppliedCommand {
    pub fn undo(self, model: &mut DomainModel) -> Result<(), DomainValidationError> {
        self.patch.undo(model)?;
        model.touch_revision();
        Ok(())
    }

    pub fn redo(self, model: &mut DomainModel) -> Result<AppliedCommand, DomainValidationError> {
        self.command.apply(model)
    }
}

impl DomainPatch {
    pub fn undo(self, model: &mut DomainModel) -> Result<(), DomainValidationError> {
        match self {
            Self::AddedComponent(component) => {
                let _removed = model.components.shift_remove(&component.id);
            }
            Self::MovedComponent { component_id, from, to: _ } => {
                let component = model
                    .components
                    .get_mut(&component_id)
                    .ok_or(DomainValidationError::component_not_found(component_id))?;
                component.position = from;
            }
            Self::RenamedComponent { component_id, from, to: _ } => {
                let component = model
                    .components
                    .get_mut(&component_id)
                    .ok_or(DomainValidationError::component_not_found(component_id))?;
                component.name = from;
            }
            Self::ProjectRenamed { from, to: _ } => {
                model.meta.name = from;
            }
            Self::LayerChanged { component_id, from, to: _ } => {
                let component = model
                    .components
                    .get_mut(&component_id)
                    .ok_or(DomainValidationError::component_not_found(component_id))?;
                component.layer = from;
            }
            Self::RulesChanged { from, to: _ } => {
                model.rules = from;
            }
            Self::RemovedComponent(component) => {
                let _replaced = model.components.insert(component.id, component);
            }
            Self::Composite(patches) => {
                for patch in patches.into_iter().rev() {
                    patch.undo(model)?;
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn batch_command_applies_and_undoes() {
        let mut model = DomainModel::new("batch");
        let component_id = ComponentId::new();
        let batch = DomainCommand::Batch {
            label: "seed".to_owned(),
            commands: vec![
                DomainCommand::PlaceComponent {
                    component_id,
                    name: "U1".to_owned(),
                    position: Point2i::new(10, 20),
                },
                DomainCommand::RenameComponent { component_id, name: "CTRL".to_owned() },
            ],
        };

        let applied = batch.apply(&mut model).expect("apply batch");
        assert_eq!(model.components.get(&component_id).expect("component").name, "CTRL");

        applied.undo(&mut model).expect("undo batch");
        assert!(!model.components.contains_key(&component_id));
    }

    #[test]
    fn set_component_layer_updates_and_undoes() {
        let mut model = DomainModel::new("layer");
        let component_id = ComponentId::new();
        DomainCommand::PlaceComponent {
            component_id,
            name: "U2".to_owned(),
            position: Point2i::new(0, 0),
        }
        .apply(&mut model)
        .expect("place component");

        let applied = DomainCommand::SetComponentLayer { component_id, layer: 3 }
            .apply(&mut model)
            .expect("set layer");
        assert_eq!(model.components.get(&component_id).expect("component").layer, 3);

        applied.undo(&mut model).expect("undo layer");
        assert_eq!(model.components.get(&component_id).expect("component").layer, 0);
    }

    #[test]
    fn set_rules_updates_and_undoes() {
        let mut model = DomainModel::new("rules");
        let from = model.rules.clone();

        let applied = DomainCommand::SetRules { min_spacing_um: 200, grid_step_um: 25 }
            .apply(&mut model)
            .expect("set rules");
        assert_eq!(model.rules.min_spacing_um, 200);
        assert_eq!(model.rules.grid_step_um, 25);

        applied.undo(&mut model).expect("undo rules");
        assert_eq!(model.rules.min_spacing_um, from.min_spacing_um);
        assert_eq!(model.rules.grid_step_um, from.grid_step_um);
    }

    #[test]
    fn rename_project_updates_and_undoes() {
        let mut model = DomainModel::new("original");
        let applied = DomainCommand::RenameProject { name: "Renamed Project".to_owned() }
            .apply(&mut model)
            .expect("rename project");

        assert_eq!(model.meta.name, "Renamed Project");

        applied.undo(&mut model).expect("undo rename project");
        assert_eq!(model.meta.name, "original");
    }

    #[test]
    fn rename_component_rejects_duplicate_name() {
        let mut model = DomainModel::new("duplicate-name");
        let first = ComponentId::new();
        let second = ComponentId::new();

        DomainCommand::PlaceComponent {
            component_id: first,
            name: "A1".to_owned(),
            position: Point2i::new(0, 0),
        }
        .apply(&mut model)
        .expect("place first");

        DomainCommand::PlaceComponent {
            component_id: second,
            name: "B1".to_owned(),
            position: Point2i::new(100, 0),
        }
        .apply(&mut model)
        .expect("place second");

        let result = DomainCommand::RenameComponent { component_id: second, name: "A1".to_owned() }
            .apply(&mut model);
        assert!(result.is_err());
    }
}
