use domain_core::DomainModel;
use engine_drc::run_drc;
use engine_simulation::{run_simulation, SimulationConfig};
use serde::{Deserialize, Serialize};
use std::fmt::Write;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineeringReport {
    pub project_name: String,
    pub timestamp: u64,
    pub component_count: usize,
    pub net_count: usize,
    pub drc_violations: usize,
    pub max_voltage: f64,
    pub total_power_mw: f64,
    pub report_body: String,
}

pub struct ReportGenerator;

impl ReportGenerator {
    pub fn generate(model: &DomainModel) -> EngineeringReport {
        let drc_report = run_drc(model);
        let sim_report = run_simulation(model, SimulationConfig::default());
        
        let mut body = String::new();
        writeln!(body, "# Engineering Report: {}", model.meta.name).unwrap();
        writeln!(body, "\n## 1. Design Summary").unwrap();
        writeln!(body, "- **Components**: {}", model.components.len()).unwrap();
        writeln!(body, "- **Nets**: {}", model.nets.len()).unwrap();
        
        writeln!(body, "\n## 2. Design Rule Check (DRC)").unwrap();
        if drc_report.violations.is_empty() {
            writeln!(body, "✅ No violations found. Design is compliant with current rules.").unwrap();
        } else {
            writeln!(body, "❌ Found {} violations:", drc_report.violations.len()).unwrap();
            for (i, v) in drc_report.violations.iter().enumerate().take(10) {
                writeln!(body, "{}. [{:?}] {}", i + 1, v.kind, v.message).unwrap();
            }
            if drc_report.violations.len() > 10 {
                writeln!(body, "... and {} more.", drc_report.violations.len() - 10).unwrap();
            }
        }
        
        writeln!(body, "\n## 3. Electrical Simulation").unwrap();
        writeln!(body, "- **Max Voltage**: {:.2} V", sim_report.max_voltage).unwrap();
        writeln!(body, "- **Total Power Consumption**: {:.2} mW", model.total_power_mw()).unwrap();
        
        writeln!(body, "\n## 4. Component List (BOM Preview)").unwrap();
        for comp in model.components.values().take(5) {
            writeln!(body, "- {}: {} ({})", comp.name, comp.package, comp.category).unwrap();
        }
        
        EngineeringReport {
            project_name: model.meta.name.clone(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            component_count: model.components.len(),
            net_count: model.nets.len(),
            drc_violations: drc_report.violations.len(),
            max_voltage: sim_report.max_voltage,
            total_power_mw: model.total_power_mw(),
            report_body: body,
        }
    }
}
