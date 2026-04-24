use domain_core::{Component, DomainModel};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Write;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GerberExportConfig {
    pub project_name: String,
    pub export_layers: Vec<i32>,
    pub unit: GerberUnit,
    pub precision: GerberPrecision,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GerberUnit {
    Millimeters,
    Inches,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GerberPrecision {
    Standard,
    HighPrecision,
}

impl Default for GerberExportConfig {
    fn default() -> Self {
        Self {
            project_name: "design".to_string(),
            export_layers: vec![0, 1, 2, 3],
            unit: GerberUnit::Millimeters,
            precision: GerberPrecision::Standard,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct BOMEntry {
    pub designator: String,
    pub value: String,
    pub package: String,
    pub quantity: usize,
    pub manufacturer: String,
    pub part_number: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BOM {
    pub entries: Vec<BOMEntry>,
    pub total_parts: usize,
    pub unique_parts: usize,
}

pub struct GerberExporter {
    config: GerberExportConfig,
}

impl GerberExporter {
    #[must_use]
    pub fn new(config: GerberExportConfig) -> Self {
        Self { config }
    }

    pub fn generate_layer(&self, model: &DomainModel, layer: i32) -> String {
        let mut gerber = String::new();

        writeln!(&mut gerber, "%FSLAX24Y24*%").ok();
        writeln!(&mut gerber, "%MOIN*%").ok();
        writeln!(&mut gerber, "%LFPC*%").ok();
        writeln!(&mut gerber, "G01*").ok();
        writeln!(&mut gerber, "D10*").ok();

        let components_on_layer: Vec<_> = model
            .components
            .values()
            .filter(|c| c.layer == layer)
            .collect();

        for comp in components_on_layer {
            let x = self.convert_coordinate(comp.position.x);
            let y = self.convert_coordinate(comp.position.y);
            writeln!(&mut gerber, "X{}Y{}D02*", x, y).ok();
            writeln!(&mut gerber, "X{}Y{}D01*", x, y).ok();
        }

        writeln!(&mut gerber, "M02*").ok();

        gerber
    }

    pub fn generate_all_layers(&self, model: &DomainModel) -> HashMap<i32, String> {
        let mut layers = HashMap::new();
        for &layer in &self.config.export_layers {
            layers.insert(layer, self.generate_layer(model, layer));
        }
        layers
    }

    fn convert_coordinate(&self, value: i64) -> String {
        match self.config.precision {
            GerberPrecision::Standard => format!("{:06}", value / 10),
            GerberPrecision::HighPrecision => format!("{:07}", value),
        }
    }
}

pub struct BOMGenerator;

impl BOMGenerator {
    pub fn generate(model: &DomainModel) -> BOM {
        let mut entries = Vec::new();
        let mut part_map: HashMap<(String, String, String), Vec<String>> = HashMap::new();

        for comp in model.components.values() {
            let key = (comp.package.clone(), comp.category.clone(), comp.name.clone());
            part_map.entry(key).or_insert_with(Vec::new).push(comp.name.clone());
        }

        for ((package, category, name), designators) in part_map {
            entries.push(BOMEntry {
                designator: designators.join(", "),
                value: name.clone(),
                package,
                quantity: designators.len(),
                manufacturer: Self::guess_manufacturer(&name),
                part_number: Self::guess_part_number(&name),
            });
        }

        entries.sort();

        let total_parts = entries.iter().map(|e| e.quantity).sum();
        let unique_parts = entries.len();

        BOM {
            entries,
            total_parts,
            unique_parts,
        }
    }

    pub fn export_csv(bom: &BOM) -> String {
        let mut csv = String::from("Designator,Value,Package,Quantity,Manufacturer,Part Number\n");

        for entry in &bom.entries {
            writeln!(
                &mut csv,
                "{},{},{},{},{},{}",
                entry.designator, entry.value, entry.package, entry.quantity,
                entry.manufacturer, entry.part_number
            )
            .ok();
        }

        csv
    }

    pub fn export_json(bom: &BOM) -> String {
        serde_json::to_string_pretty(bom).unwrap_or_default()
    }

    fn guess_manufacturer(component_name: &str) -> String {
        if component_name.contains("RISC-V") {
            "SiFive".to_string()
        } else if component_name.contains("Flash") {
            "Winbond".to_string()
        } else if component_name.contains("SRAM") {
            "Cypress".to_string()
        } else if component_name.contains("DRAM") {
            "SK Hynix".to_string()
        } else if component_name.contains("PWM") || component_name.contains("UART") {
            "NXP".to_string()
        } else {
            "TBD".to_string()
        }
    }

    fn guess_part_number(component_name: &str) -> String {
        format!("PN-{}", component_name.replace(" ", "-"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gerber_exporter_generates_header() {
        let config = GerberExportConfig::default();
        let exporter = GerberExporter::new(config);
        let model = DomainModel::new("test");
        let gerber = exporter.generate_layer(&model, 0);
        assert!(gerber.contains("%FSLAX24Y24*%"));
        assert!(gerber.contains("M02*"));
    }

    #[test]
    fn bom_generator_creates_entries() {
        let model = DomainModel::new("test");
        let bom = BOMGenerator::generate(&model);
        assert_eq!(bom.total_parts, 0);
        assert_eq!(bom.unique_parts, 0);
    }
}
