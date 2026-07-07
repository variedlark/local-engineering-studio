use domain_core::DomainModel;
use serde::{Deserialize, Serialize};
use std::fmt::Write;

macro_rules! step_writeln {
    ($buffer:expr, $($arg:tt)*) => {{
        let _ignored = writeln!($buffer, $($arg)*);
    }};
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExportConfig {
    pub pcb_thickness_mm: f64,
    pub include_components: bool,
    pub include_silkscreen: bool,
    pub scale_factor: f64,
    /// Explicit board width in millimetres. The domain model does not yet carry a board outline.
    pub board_width_mm: f64,
    /// Explicit board height in millimetres. The domain model does not yet carry a board outline.
    pub board_height_mm: f64,
    /// Deterministic STEP header timestamp. Callers may set the current time at the boundary.
    pub generated_at: String,
}

impl Default for StepExportConfig {
    fn default() -> Self {
        Self {
            pcb_thickness_mm: 1.6,
            include_components: true,
            include_silkscreen: true,
            scale_factor: 1.0,
            board_width_mm: 100.0,
            board_height_mm: 100.0,
            generated_at: "1970-01-01T00:00:00Z".to_string(),
        }
    }
}

pub struct StepExporter;

impl StepExporter {
    /// Generate an experimental STEP-like preview. This is not a complete CAD-grade AP203 model.
    pub fn export(model: &DomainModel, config: StepExportConfig) -> String {
        let mut step_content = String::new();

        // STEP file header
        step_writeln!(step_content, "ISO-10303-21;");
        step_writeln!(step_content, "HEADER;");
        step_writeln!(
            step_content,
            "FILE_DESCRIPTION(('EXPERIMENTAL PCB preview from Local Engineering Studio - simplified geometry only'),"
        );
        step_writeln!(step_content, "  '2;1');");
        step_writeln!(step_content, "FILE_NAME('pcb_design.stp',");
        step_writeln!(step_content, "  {},", escape_step_string(&config.generated_at));
        step_writeln!(step_content, "  (''),");
        step_writeln!(step_content, "  (''),");
        step_writeln!(step_content, "  'Manus Local Engineering Studio',");
        step_writeln!(step_content, "  '',");
        step_writeln!(step_content, "  '');");
        step_writeln!(
            step_content,
            "FILE_SCHEMA(('AP203_CONFIG_CONTROLLED_3D_DESIGN_OF_MECHANICAL_PARTS_AND_ASSEMBLIES_4'));"
        );
        step_writeln!(step_content, "ENDSEC;");

        step_writeln!(step_content, "DATA;");

        // PCB base as a rectangular solid
        let scale = finite_positive(config.scale_factor, 1.0);
        let pcb_width = finite_positive(config.board_width_mm, 100.0) * scale;
        let pcb_height = finite_positive(config.board_height_mm, 100.0) * scale;
        let pcb_thickness = finite_positive(config.pcb_thickness_mm, 1.6) * scale;

        step_writeln!(step_content, "#1 = AXIS2_PLACEMENT_3D('PCB Origin',#2,#3,#4);");
        step_writeln!(step_content, "#2 = CARTESIAN_POINT('',(0.0,0.0,0.0));");
        step_writeln!(step_content, "#3 = DIRECTION('',(0.0,0.0,1.0));");
        step_writeln!(step_content, "#4 = DIRECTION('',(1.0,0.0,0.0));");

        // PCB rectangular solid
        step_writeln!(
            step_content,
            "#5 = RECTANGULAR_BOX('PCB_Base',#1,{},{},{});",
            pcb_width,
            pcb_height,
            pcb_thickness
        );

        let mut entity_id = 6;

        // Add components as boxes if enabled
        if config.include_components {
            for (idx, comp) in model.components.iter().enumerate() {
                let comp_x = comp.1.position.x as f64 * scale / 1000.0;
                let comp_y = comp.1.position.y as f64 * scale / 1000.0;
                let comp_z = pcb_thickness;

                let comp_width = finite_positive(comp.1.width_um as f64 / 1000.0, 1.0) * scale;
                let comp_height = finite_positive(comp.1.height_um as f64 / 1000.0, 1.0) * scale;
                let comp_thickness = 2.0 * scale;

                step_writeln!(
                    step_content,
                    "#{} = AXIS2_PLACEMENT_3D('Component_{}',#{},#{},#{});",
                    entity_id,
                    idx,
                    entity_id + 1,
                    entity_id + 2,
                    entity_id + 3
                );
                step_writeln!(
                    step_content,
                    "#{} = CARTESIAN_POINT('',({}.,{}.,{}.));",
                    entity_id + 1,
                    comp_x,
                    comp_y,
                    comp_z
                );
                step_writeln!(step_content, "#{} = DIRECTION('',(0.0,0.0,1.0));", entity_id + 2);
                step_writeln!(step_content, "#{} = DIRECTION('',(1.0,0.0,0.0));", entity_id + 3);
                step_writeln!(
                    step_content,
                    "#{} = RECTANGULAR_BOX({},#{},{:.2},{:.2},{:.2});",
                    entity_id + 4,
                    escape_step_string(&comp.1.name),
                    entity_id,
                    comp_width,
                    comp_height,
                    comp_thickness
                );

                entity_id += 5;
            }
        }

        if config.include_silkscreen {
            step_writeln!(
                step_content,
                "#{} = ANNOTATION_TEXT('Silkscreen preview included (experimental)');",
                entity_id
            );
        }

        step_writeln!(step_content, "ENDSEC;");
        step_writeln!(step_content, "END-ISO-10303-21;");

        step_content
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn step_export_generates_valid_header() {
        let model = DomainModel::new("test");
        let config = StepExportConfig::default();
        let step = StepExporter::export(&model, config);

        assert!(step.contains("ISO-10303-21"));
        assert!(step.contains("FILE_DESCRIPTION"));
        assert!(step.contains("DATA;"));
        assert!(step.contains("ENDSEC;"));
    }

    #[test]
    fn step_export_uses_configured_dimensions_scale_and_escaping() {
        let mut model = DomainModel::new("test");
        let id = foundation_core::ComponentId::new();
        let _previous = model.components.insert(
            id,
            domain_core::Component {
                id,
                name: "U1 'quoted'".into(),
                position: foundation_core::Point2i::new(1_000, 2_000),
                layer: 0,
                width_um: 3_000,
                height_um: 4_000,
                rotation_deg: 0,
                power_mw: 0.0,
                voltage_v: 3.3,
                package: String::new(),
                category: String::new(),
                value: String::new(),
                manufacturer: String::new(),
                part_number: String::new(),
            },
        );
        let step = StepExporter::export(
            &model,
            StepExportConfig {
                board_width_mm: 10.0,
                board_height_mm: 20.0,
                pcb_thickness_mm: 2.0,
                scale_factor: 2.0,
                generated_at: "2026-01-02T03:04:05Z".into(),
                ..Default::default()
            },
        );
        assert!(step.contains("EXPERIMENTAL PCB preview"));
        assert!(step.contains("RECTANGULAR_BOX('PCB_Base',#1,20,40,4)"));
        assert!(step.contains("'U1 ''quoted'''"));
        assert!(step.contains("'2026-01-02T03:04:05Z'"));
    }

    #[test]
    fn step_export_can_exclude_components_and_silkscreen() {
        let model = DomainModel::new("test");
        let step = StepExporter::export(
            &model,
            StepExportConfig {
                include_components: false,
                include_silkscreen: false,
                ..Default::default()
            },
        );
        assert!(!step.contains("Component_"));
        assert!(!step.contains("Silkscreen preview"));
    }

    #[test]
    fn step_export_includes_pcb_base() {
        let model = DomainModel::new("test");
        let config = StepExportConfig::default();
        let step = StepExporter::export(&model, config);

        assert!(step.contains("PCB_Base"));
        assert!(step.contains("RECTANGULAR_BOX"));
    }
}

fn finite_positive(value: f64, fallback: f64) -> f64 {
    if value.is_finite() && value > 0.0 { value } else { fallback }
}

fn escape_step_string(value: &str) -> String {
    format!("\'{}\'", value.replace('\\', "\\\\").replace('\'', "\'\'"))
}
