use domain_core::{Component, DomainModel};
use serde::{Deserialize, Serialize};
use std::fmt::Write;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExportConfig {
    pub pcb_thickness_mm: f64,
    pub include_components: bool,
    pub include_silkscreen: bool,
    pub scale_factor: f64,
}

impl Default for StepExportConfig {
    fn default() -> Self {
        Self {
            pcb_thickness_mm: 1.6,
            include_components: true,
            include_silkscreen: true,
            scale_factor: 1.0,
        }
    }
}

pub struct StepExporter;

impl StepExporter {
    /// Generate a STEP 3D model file content (simplified STEP format)
    pub fn export(model: &DomainModel, config: StepExportConfig) -> String {
        let mut step_content = String::new();
        
        // STEP file header
        writeln!(step_content, "ISO-10303-21;").unwrap();
        writeln!(step_content, "HEADER;").unwrap();
        writeln!(step_content, "FILE_DESCRIPTION(('PCB Design from Local Engineering Studio'),").unwrap();
        writeln!(step_content, "  '2;1');").unwrap();
        writeln!(step_content, "FILE_NAME('pcb_design.stp',").unwrap();
        writeln!(step_content, "  2024-01-01T00:00:00,").unwrap();
        writeln!(step_content, "  (''),").unwrap();
        writeln!(step_content, "  (''),").unwrap();
        writeln!(step_content, "  'Manus Local Engineering Studio',").unwrap();
        writeln!(step_content, "  '',").unwrap();
        writeln!(step_content, "  '');").unwrap();
        writeln!(step_content, "FILE_SCHEMA(('AP203_CONFIG_CONTROLLED_3D_DESIGN_OF_MECHANICAL_PARTS_AND_ASSEMBLIES_4'));").unwrap();
        writeln!(step_content, "ENDSEC;").unwrap();
        
        writeln!(step_content, "DATA;").unwrap();
        
        // PCB base as a rectangular solid
        let pcb_width = 100.0 * config.scale_factor;
        let pcb_height = 100.0 * config.scale_factor;
        let pcb_thickness = config.pcb_thickness_mm * config.scale_factor;
        
        writeln!(step_content, "#1 = AXIS2_PLACEMENT_3D('PCB Origin',#2,#3,#4);").unwrap();
        writeln!(step_content, "#2 = CARTESIAN_POINT('',(0.0,0.0,0.0));").unwrap();
        writeln!(step_content, "#3 = DIRECTION('',(0.0,0.0,1.0));").unwrap();
        writeln!(step_content, "#4 = DIRECTION('',(1.0,0.0,0.0));").unwrap();
        
        // PCB rectangular solid
        writeln!(step_content, "#5 = RECTANGULAR_BOX('PCB_Base',#1,{},{},{});", pcb_width, pcb_height, pcb_thickness).unwrap();
        
        let mut entity_id = 6;
        
        // Add components as boxes if enabled
        if config.include_components {
            for (idx, comp) in model.components.iter().enumerate() {
                let comp_x = comp.1.position.x as f64 * config.scale_factor / 1000.0;
                let comp_y = comp.1.position.y as f64 * config.scale_factor / 1000.0;
                let comp_z = config.pcb_thickness_mm * config.scale_factor + 2.0;
                
                let comp_width = comp.1.width_um as f64 * config.scale_factor / 1000.0;
                let comp_height = comp.1.height_um as f64 * config.scale_factor / 1000.0;
                let comp_thickness = 2.0 * config.scale_factor;
                
                writeln!(step_content, "#{} = AXIS2_PLACEMENT_3D('Component_{}',#{},#{},#{});", 
                         entity_id, idx, entity_id + 1, entity_id + 2, entity_id + 3).unwrap();
                writeln!(step_content, "#{} = CARTESIAN_POINT('',({}.,{}.,{}.));", 
                         entity_id + 1, comp_x, comp_y, comp_z).unwrap();
                writeln!(step_content, "#{} = DIRECTION('',(0.0,0.0,1.0));", entity_id + 2).unwrap();
                writeln!(step_content, "#{} = DIRECTION('',(1.0,0.0,0.0));", entity_id + 3).unwrap();
                writeln!(step_content, "#{} = RECTANGULAR_BOX('{}',#{},{:.2},{:.2},{:.2});", 
                         entity_id + 4, comp.1.name, entity_id, comp_width, comp_height, comp_thickness).unwrap();
                
                entity_id += 5;
            }
        }
        
        writeln!(step_content, "ENDSEC;").unwrap();
        writeln!(step_content, "END-ISO-10303-21;").unwrap();
        
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
    fn step_export_includes_pcb_base() {
        let model = DomainModel::new("test");
        let config = StepExportConfig::default();
        let step = StepExporter::export(&model, config);
        
        assert!(step.contains("PCB_Base"));
        assert!(step.contains("RECTANGULAR_BOX"));
    }
}
