use app_core::AppError;
use app_core::project::ProjectSession;
use domain_core::DomainModel;
use domain_core::command::{AppliedCommand, DomainCommand};
use engine_drc::DrcReport;
use engine_routing::RouteResult;
use engine_simulation::{SimulationConfig, SimulationReport};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRequestDto {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectResponseDto {
    pub project_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenProjectRequestDto {
    pub project_id: Uuid,
    pub bundle_root: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistProjectRequestDto {
    pub project_id: Uuid,
    pub bundle_root: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportProjectRequestDto {
    pub project_id: Uuid,
    pub output_file: String,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportProjectRequestDto {
    pub input_file: String,
    pub name_override: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPathResponseDto {
    pub project_id: Uuid,
    pub bundle_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportExportStatsDto {
    pub components: usize,
    pub nets: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequestDto {
    pub project_id: Uuid,
    pub command: DomainCommand,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResponseDto {
    pub ok: bool,
    pub error_code: Option<String>,
    pub message: Option<String>,
    pub revision: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoRedoRequestDto {
    pub project_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoRedoResponseDto {
    pub ok: bool,
    pub changed: bool,
    pub error_code: Option<String>,
    pub message: Option<String>,
    pub revision: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisRequestDto {
    pub project_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteRequestDto {
    pub project_id: Uuid,
    pub from_component_id: Uuid,
    pub to_component_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationRequestDto {
    pub project_id: Uuid,
    pub config: SimulationConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSnapshotDto {
    pub project_id: Uuid,
    pub name: String,
    pub revision: u64,
    pub dirty: bool,
    pub can_undo: bool,
    pub can_redo: bool,
    pub last_autosave_ms: Option<u64>,
    pub model: DomainModel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListOpenProjectsResponseDto {
    pub projects: Vec<ProjectSnapshotDto>,
}

impl From<&ProjectSession> for ProjectSnapshotDto {
    fn from(value: &ProjectSession) -> Self {
        Self {
            project_id: value.model.meta.project_id.as_uuid(),
            name: value.model.meta.name.clone(),
            revision: value.model.meta.revision,
            dirty: value.dirty,
            can_undo: value.history.can_undo(),
            can_redo: value.history.can_redo(),
            last_autosave_ms: value.last_autosave_ms,
            model: value.model.clone(),
        }
    }
}

impl From<AppError> for CommandResponseDto {
    fn from(value: AppError) -> Self {
        Self {
            ok: false,
            error_code: Some(format!("{:?}", value.error_code())),
            message: Some(value.to_string()),
            revision: None,
        }
    }
}

impl CommandResponseDto {
    #[must_use]
    pub fn from_applied(applied: &AppliedCommand) -> Self {
        Self { ok: true, error_code: None, message: None, revision: Some(applied.revision_after) }
    }
}

impl From<AppError> for UndoRedoResponseDto {
    fn from(value: AppError) -> Self {
        Self {
            ok: false,
            changed: false,
            error_code: Some(format!("{:?}", value.error_code())),
            message: Some(value.to_string()),
            revision: None,
        }
    }
}

pub type DrcResponseDto = DrcReport;
pub type RouteResponseDto = RouteResult;
pub type SimulationResponseDto = SimulationReport;
