use app_core::project::ProjectSession;
use domain_core::{Component, DomainModel};
use engine_drc::run_drc;
use engine_routing::{route_a_star_3d, GridPoint3D};
use engine_simulation::{SimulationConfig, run_simulation};
use foundation_core::Point2i;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

pub mod gerber_export;
pub mod step_exporter;
pub mod report_generator;

pub use gerber_export::{GerberExporter, GerberExportConfig, BOMGenerator, BOM, BOMEntry};
pub use step_exporter::{StepExporter, StepExportConfig};
pub use report_generator::{ReportGenerator, EngineeringReport};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportExportStats {
    pub components: usize,
    pub nets: usize,
}

#[derive(Debug, thiserror::Error)]
pub enum IoAdapterError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("unsupported format: {0}")]
    UnsupportedFormat(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportBundle {
    pub model: DomainModel,
    pub stats: ImportExportStats,
}

pub fn export_project_json(
    session: &ProjectSession,
    output_file: impl AsRef<Path>,
) -> Result<ImportExportStats, IoAdapterError> {
    let output = output_file.as_ref();
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }
    let content = export_to_content(session)?;
    fs::write(output, content)?;
    Ok(ImportExportStats {
        components: session.model.components.len(),
        nets: session.model.nets.len(),
    })
}

pub fn import_project_json(
    input_file: impl AsRef<Path>,
    name_override: Option<String>,
) -> Result<ProjectSession, IoAdapterError> {
    let content = fs::read_to_string(input_file)?;
    import_from_content(&content, name_override)
}

pub fn import_session_into_service(
    service: &mut app_core::AppService,
    input_file: impl AsRef<Path>,
    name_override: Option<String>,
) -> Result<foundation_core::ProjectId, IoAdapterError> {
    let session = import_project_json(input_file, name_override)?;
    Ok(service.insert_session(session))
}

pub fn export_project_svg(
    session: &ProjectSession,
    output_file: impl AsRef<Path>,
) -> Result<ImportExportStats, IoAdapterError> {
    let output = output_file.as_ref();
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }
    let stats = ImportExportStats {
        components: session.model.components.len(),
        nets: session.model.nets.len(),
    };

    let mut body = String::new();
    let drc = run_drc(&session.model);
    let sim = run_simulation(&session.model, SimulationConfig::default());
    let route = route_a_star_3d(&engine_routing::RouteRequest {
        start: GridPoint3D::new(0, 0, 0),
        end: GridPoint3D::new(5, 0, 0),
        blocked_points: std::collections::HashSet::new(),
        max_steps: 256,
        allowed_layers: vec![0, 1],
    });

    for component in session.model.components.values() {
        body.push_str(&component_to_svg(component));
    }
    body.push_str(&format!(
        "<text x=\"24\" y=\"30\" fill=\"#9ecbff\" font-size=\"12\">DRC: {} | Sim: {:.2}V | Vias: {} | Nodes: {}</text>",
        drc.violations.len(),
        sim.max_voltage,
        route.via_count,
        route.path.len()
    ));

    let svg = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1600\" height=\"1000\" viewBox=\"0 0 1600 1000\"><rect width=\"100%\" height=\"100%\" fill=\"#0f1724\"/>{body}</svg>"
    );
    fs::write(output, svg)?;

    Ok(stats)
}

fn component_to_svg(component: &Component) -> String {
    let Point2i { x, y } = component.position;
    format!(
        "<g transform=\"translate({x},{y})\"><rect x=\"-28\" y=\"-18\" width=\"56\" height=\"36\" rx=\"6\" fill=\"#2d3f57\" stroke=\"#6ec1ff\" stroke-width=\"2\"/><text x=\"0\" y=\"4\" fill=\"#f4f8ff\" text-anchor=\"middle\" font-size=\"11\">{}</text></g>",
        escape_svg_text(&component.name)
    )
}

pub fn import_from_content(
    content: &str,
    name_override: Option<String>,
) -> Result<ProjectSession, IoAdapterError> {
    let mut export = serde_json::from_str::<ExportBundle>(content)?;
    if let Some(name) = name_override {
        export.model.meta.name = name;
    }
    let snapshot = app_core::project::SessionSnapshot {
        model: export.model,
        history: app_core::CommandHistory::new(),
        updated_at_ms: foundation_core::unix_millis_now(),
    };
    Ok(ProjectSession::from_snapshot(snapshot))
}

pub fn export_to_content(session: &ProjectSession) -> Result<String, IoAdapterError> {
    let stats = ImportExportStats {
        components: session.model.components.len(),
        nets: session.model.nets.len(),
    };
    let export = ExportBundle { model: session.model.clone(), stats };
    Ok(serde_json::to_string_pretty(&export)?)
}

fn escape_svg_text(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_and_import_json_round_trip() {
        let mut session = ProjectSession::new("io-test");
        let component_id = foundation_core::ComponentId::new();
        session
            .execute(domain_core::DomainCommand::PlaceComponent {
                component_id,
                name: "U1".to_owned(),
                position: Point2i::new(100, 100),
            })
            .expect("place component");

        let output = std::env::temp_dir().join("io_test_project.json");
        let _stats = export_project_json(&session, &output).expect("export json");
        let imported =
            import_project_json(&output, Some("Imported".to_owned())).expect("import json");
        assert_eq!(imported.model.meta.name, "Imported");
        assert_eq!(imported.model.components.len(), 1);
        let _cleanup = fs::remove_file(output);
    }

    #[test]
    fn export_to_content_and_import_from_content_round_trip() {
        let mut session = ProjectSession::new("io-memory");
        let component_id = foundation_core::ComponentId::new();
        session
            .execute(domain_core::DomainCommand::PlaceComponent {
                component_id,
                name: "M1".to_owned(),
                position: Point2i::new(42, 84),
            })
            .expect("place component");

        let content = export_to_content(&session).expect("export content");
        let imported = import_from_content(&content, Some("ImportedMemory".to_owned()))
            .expect("import content");
        assert_eq!(imported.model.meta.name, "ImportedMemory");
        assert_eq!(imported.model.components.len(), 1);
    }

    #[test]
    fn export_svg_creates_output_file() {
        let mut session = ProjectSession::new("svg-test");
        let component_id = foundation_core::ComponentId::new();
        session
            .execute(domain_core::DomainCommand::PlaceComponent {
                component_id,
                name: "S1".to_owned(),
                position: Point2i::new(200, 220),
            })
            .expect("place component");

        let output = std::env::temp_dir().join("io_test_project.svg");
        let stats = export_project_svg(&session, &output).expect("export svg");
        assert_eq!(stats.components, 1);
        let content = fs::read_to_string(&output).expect("read svg");
        assert!(content.contains("<svg"));
        let _cleanup = fs::remove_file(output);
    }
}
