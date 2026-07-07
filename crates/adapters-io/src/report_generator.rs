use domain_core::DomainModel;
use engine_drc::run_drc;
use engine_simulation::{SimulationConfig, run_simulation};
use serde::{Deserialize, Serialize};
use std::fmt::Write;

macro_rules! report_writeln {
    ($buffer:expr, $($arg:tt)*) => {{
        let _ignored = writeln!($buffer, $($arg)*);
    }};
}

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
        report_writeln!(body, "# Engineering Report: {}", model.meta.name);
        report_writeln!(body, "\n## 1. Design Summary");
        report_writeln!(body, "- **Components**: {}", model.components.len());
        report_writeln!(body, "- **Nets**: {}", model.nets.len());

        report_writeln!(body, "\n## 2. Design Rule Check (DRC)");
        if drc_report.violations.is_empty() {
            report_writeln!(
                body,
                "✅ No violations found. Design is compliant with current rules."
            );
        } else {
            report_writeln!(body, "❌ Found {} violations:", drc_report.violations.len());
            for (i, v) in drc_report.violations.iter().enumerate().take(10) {
                report_writeln!(body, "{}. [{:?}] {}", i + 1, v.kind, v.message);
            }
            if drc_report.violations.len() > 10 {
                report_writeln!(body, "... and {} more.", drc_report.violations.len() - 10);
            }
        }

        report_writeln!(body, "\n## 3. Electrical Simulation");
        report_writeln!(body, "- **Max Voltage**: {:.2} V", sim_report.max_voltage);
        report_writeln!(body, "- **Total Power Consumption**: {:.2} mW", model.total_power_mw());

        report_writeln!(body, "\n## 4. Component List (BOM Preview)");
        for comp in model.components.values().take(5) {
            report_writeln!(body, "- {}: {} ({})", comp.name, comp.package, comp.category);
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
