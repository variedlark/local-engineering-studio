use foundation_core::{ComponentId, NetId, Point2i, ProjectId, unix_millis_now};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// Metadata for an engineering design project.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProjectMeta {
    pub project_id: ProjectId,
    pub name: String,
    pub format_major: u32,
    pub format_minor: u32,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub revision: u64,
}

/// Component node in the canonical project model.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Component {
    pub id: ComponentId,
    pub name: String,
    pub position: Point2i,
    #[serde(default)]
    pub layer: i32,
}

/// Net connecting component endpoints.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Net {
    pub id: NetId,
    pub name: String,
    pub members: Vec<ComponentId>,
}

/// Rule configuration used by validators and engines.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct RuleSet {
    pub min_spacing_um: i64,
    pub grid_step_um: i64,
}

/// Root canonical model persisted by storage adapters.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DomainModel {
    pub meta: ProjectMeta,
    pub components: IndexMap<ComponentId, Component>,
    pub nets: IndexMap<NetId, Net>,
    pub rules: RuleSet,
}

impl DomainModel {
    #[must_use]
    pub fn new(name: impl Into<String>) -> Self {
        let now = unix_millis_now();
        Self {
            meta: ProjectMeta {
                project_id: ProjectId::new(),
                name: name.into(),
                format_major: 1,
                format_minor: 0,
                created_at_ms: now,
                updated_at_ms: now,
                revision: 0,
            },
            components: IndexMap::new(),
            nets: IndexMap::new(),
            rules: RuleSet { min_spacing_um: 100, grid_step_um: 50 },
        }
    }

    pub fn touch_revision(&mut self) {
        self.meta.revision = self.meta.revision.saturating_add(1);
        self.meta.updated_at_ms = unix_millis_now();
    }

    #[must_use]
    pub fn sorted_component_ids(&self) -> Vec<ComponentId> {
        let mut ids = self.components.keys().copied().collect::<Vec<_>>();
        ids.sort_by_key(|id| id.to_string());
        ids
    }
}
