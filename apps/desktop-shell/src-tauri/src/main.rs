#![forbid(unsafe_code)]

use adapters_io::{
    ImportExportStats, IoAdapterError, export_project_json, export_project_svg, import_project_json,
};
use app_core::{AppError, AppService};
use ipc_contracts::{
    AnalysisRequestDto, CommandRequestDto, CommandResponseDto, CreateProjectRequestDto,
    CreateProjectResponseDto, DrcResponseDto, ExportProjectRequestDto, ImportExportStatsDto,
    ImportProjectRequestDto, ListOpenProjectsResponseDto, OpenProjectRequestDto,
    PersistProjectRequestDto, ProjectPathResponseDto, ProjectSnapshotDto, RouteRequestDto,
    RouteResponseDto, SimulationRequestDto, SimulationResponseDto, UndoRedoRequestDto,
    UndoRedoResponseDto,
};
use parking_lot::Mutex;
use tauri::State;

#[derive(Default)]
struct SharedAppState {
    service: Mutex<AppService>,
}

#[tauri::command]
fn create_project(
    request: CreateProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<CreateProjectResponseDto, String> {
    let mut service = state.service.lock();
    let project_id = service.create_project(request.name);
    Ok(CreateProjectResponseDto { project_id: project_id.as_uuid() })
}

#[tauri::command]
fn open_project(
    request: OpenProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<CreateProjectResponseDto, String> {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    service.open_project(project_id, request.bundle_root).map_err(|error| error.to_string())?;
    Ok(CreateProjectResponseDto { project_id: project_id.as_uuid() })
}

#[tauri::command]
fn save_project(
    request: PersistProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<ProjectPathResponseDto, String> {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    let path =
        service.save_project(project_id, request.bundle_root).map_err(|error| error.to_string())?;
    Ok(ProjectPathResponseDto {
        project_id: request.project_id,
        bundle_path: path.display().to_string(),
    })
}

#[tauri::command]
fn autosave_project(
    request: PersistProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<ProjectPathResponseDto, String> {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    let path = service
        .autosave_project(project_id, request.bundle_root)
        .map_err(|error| error.to_string())?;
    Ok(ProjectPathResponseDto {
        project_id: request.project_id,
        bundle_path: path.display().to_string(),
    })
}

#[tauri::command]
fn execute_command(
    request: CommandRequestDto,
    state: State<'_, SharedAppState>,
) -> CommandResponseDto {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    match service.execute(project_id, request.command) {
        Ok(applied) => CommandResponseDto::from_applied(&applied),
        Err(error) => error.into(),
    }
}

#[tauri::command]
fn undo(request: UndoRedoRequestDto, state: State<'_, SharedAppState>) -> UndoRedoResponseDto {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    match service.undo(project_id) {
        Ok(changed) => {
            let revision = service.session(project_id).map(|session| session.model.meta.revision);
            UndoRedoResponseDto { ok: true, changed, error_code: None, message: None, revision }
        }
        Err(error) => error.into(),
    }
}

#[tauri::command]
fn redo(request: UndoRedoRequestDto, state: State<'_, SharedAppState>) -> UndoRedoResponseDto {
    let mut service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    match service.redo(project_id) {
        Ok(changed) => {
            let revision = service.session(project_id).map(|session| session.model.meta.revision);
            UndoRedoResponseDto { ok: true, changed, error_code: None, message: None, revision }
        }
        Err(error) => error.into(),
    }
}

#[tauri::command]
fn project_snapshot(
    project_id: uuid::Uuid,
    state: State<'_, SharedAppState>,
) -> Result<ProjectSnapshotDto, String> {
    let service = state.service.lock();
    let id = foundation_core::ProjectId::from_uuid(project_id);
    let Some(session) = service.session(id) else {
        return Err(AppError::SessionNotFound.to_string());
    };

    Ok(ProjectSnapshotDto::from(session))
}

#[tauri::command]
fn list_open_projects(state: State<'_, SharedAppState>) -> ListOpenProjectsResponseDto {
    let service = state.service.lock();
    let projects = service
        .sessions_iter()
        .map(|entry| {
            let _ = entry.project_id;
            ProjectSnapshotDto::from(&entry.session)
        })
        .collect::<Vec<_>>();
    ListOpenProjectsResponseDto { projects }
}

#[tauri::command]
fn run_drc(
    request: AnalysisRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<DrcResponseDto, String> {
    let service = state.service.lock();
    service
        .drc_report(foundation_core::ProjectId::from_uuid(request.project_id))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn run_route(
    request: RouteRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<RouteResponseDto, String> {
    let service = state.service.lock();
    service
        .route_report(
            foundation_core::ProjectId::from_uuid(request.project_id),
            foundation_core::ComponentId::from_uuid(request.from_component_id),
            foundation_core::ComponentId::from_uuid(request.to_component_id),
        )
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn run_simulation(
    request: SimulationRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<SimulationResponseDto, String> {
    let service = state.service.lock();
    service
        .simulation_report(
            foundation_core::ProjectId::from_uuid(request.project_id),
            request.config,
        )
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn export_project(
    request: ExportProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<ImportExportStatsDto, String> {
    let service = state.service.lock();
    let project_id = foundation_core::ProjectId::from_uuid(request.project_id);
    let session = service
        .session(project_id)
        .ok_or(AppError::SessionNotFound)
        .map_err(|error| error.to_string())?;

    let stats = match request.format.as_str() {
        "json" => export_project_json(session, &request.output_file),
        "svg" => export_project_svg(session, &request.output_file),
        other => Err(IoAdapterError::UnsupportedFormat(other.to_owned())),
    }
    .map_err(|error| error.to_string())?;

    Ok(map_stats(stats))
}

#[tauri::command]
fn import_project(
    request: ImportProjectRequestDto,
    state: State<'_, SharedAppState>,
) -> Result<CreateProjectResponseDto, String> {
    let mut service = state.service.lock();
    let session = import_project_json(&request.input_file, request.name_override)
        .map_err(|error| error.to_string())?;
    let project_id = service.insert_session(session);
    Ok(CreateProjectResponseDto { project_id: project_id.as_uuid() })
}

fn map_stats(stats: ImportExportStats) -> ImportExportStatsDto {
    ImportExportStatsDto { components: stats.components, nets: stats.nets }
}

fn main() {
    let app = tauri::Builder::default()
        .manage(SharedAppState::default())
        .invoke_handler(tauri::generate_handler![
            create_project,
            open_project,
            save_project,
            autosave_project,
            execute_command,
            undo,
            redo,
            project_snapshot,
            list_open_projects,
            run_drc,
            run_route,
            run_simulation,
            export_project,
            import_project,
        ])
        .run(tauri::generate_context!());

    if let Err(error) = app {
        eprintln!("failed to run tauri app: {error}");
    }
}
