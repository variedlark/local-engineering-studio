use domain_core::DomainModel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Write;

macro_rules! string_writeln {
    ($buffer:expr, $($arg:tt)*) => {{
        let _ignored = writeln!($buffer, $($arg)*);
    }};
}

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

        let format_spec = match self.config.precision {
            GerberPrecision::Standard => "%FSLAX26Y26*%",
            GerberPrecision::HighPrecision => "%FSLAX36Y36*%",
        };
        string_writeln!(&mut gerber, "{format_spec}");
        match self.config.unit {
            GerberUnit::Millimeters => string_writeln!(&mut gerber, "%MOMM*%"),
            GerberUnit::Inches => string_writeln!(&mut gerber, "%MOIN*%"),
        }
        string_writeln!(&mut gerber, "%LPD*%");
        string_writeln!(&mut gerber, "%ADD10C,0.150*%");
        string_writeln!(&mut gerber, "%ADD11R,1.000X1.000*%");
        string_writeln!(&mut gerber, "G01*");

        let components_on_layer: Vec<_> =
            model.components.values().filter(|c| c.layer == layer).collect();

        for comp in components_on_layer {
            let x = self.convert_coordinate(comp.position.x);
            let y = self.convert_coordinate(comp.position.y);
            let half_w = (comp.width_um.max(1000) / 2).max(1);
            let half_h = (comp.height_um.max(1000) / 2).max(1);
            let x1 = self.convert_coordinate(comp.position.x - half_w);
            let y1 = self.convert_coordinate(comp.position.y - half_h);
            let x2 = self.convert_coordinate(comp.position.x + half_w);
            let y2 = self.convert_coordinate(comp.position.y + half_h);
            string_writeln!(&mut gerber, "D11*");
            string_writeln!(&mut gerber, "X{}Y{}D03*", x, y);
            string_writeln!(&mut gerber, "D10*");
            string_writeln!(&mut gerber, "X{}Y{}D02*", x1, y1);
            string_writeln!(&mut gerber, "X{}Y{}D01*", x2, y1);
            string_writeln!(&mut gerber, "X{}Y{}D01*", x2, y2);
            string_writeln!(&mut gerber, "X{}Y{}D01*", x1, y2);
            string_writeln!(&mut gerber, "X{}Y{}D01*", x1, y1);
        }

        string_writeln!(&mut gerber, "M02*");

        gerber
    }

    pub fn generate_all_layers(&self, model: &DomainModel) -> HashMap<i32, String> {
        let mut layers = HashMap::new();
        for &layer in &self.config.export_layers {
            let _previous = layers.insert(layer, self.generate_layer(model, layer));
        }
        layers
    }

    fn convert_coordinate(&self, value: i64) -> String {
        let mm = value as f64 / 1000.0;
        let unit_value = match self.config.unit {
            GerberUnit::Millimeters => mm,
            GerberUnit::Inches => mm / 25.4,
        };
        let scale = match self.config.precision {
            GerberPrecision::Standard => 1_000_000.0,
            GerberPrecision::HighPrecision => 1_000_000.0,
        };
        format!("{}", (unit_value * scale).round() as i64)
    }
}

pub struct BOMGenerator;

impl BOMGenerator {
    pub fn generate(model: &DomainModel) -> BOM {
        let mut entries = Vec::new();
        let mut part_map: HashMap<(String, String, String, String), Vec<String>> = HashMap::new();

        for comp in model.components.values() {
            let value = if comp.value.is_empty() { comp.name.clone() } else { comp.value.clone() };
            let key =
                (comp.package.clone(), value, comp.manufacturer.clone(), comp.part_number.clone());
            part_map.entry(key).or_default().push(comp.name.clone());
        }

        for ((package, value, manufacturer, part_number), designators) in part_map {
            entries.push(BOMEntry {
                designator: designators.join(", "),
                value,
                package,
                quantity: designators.len(),
                manufacturer,
                part_number,
            });
        }

        entries.sort();

        let total_parts = entries.iter().map(|e| e.quantity).sum();
        let unique_parts = entries.len();

        BOM { entries, total_parts, unique_parts }
    }

    pub fn export_csv(bom: &BOM) -> String {
        let mut csv = String::from("Designator,Value,Package,Quantity,Manufacturer,Part Number\n");

        for entry in &bom.entries {
            string_writeln!(
                &mut csv,
                "{},{},{},{},{},{}",
                csv_field(&entry.designator),
                csv_field(&entry.value),
                csv_field(&entry.package),
                entry.quantity,
                csv_field(&entry.manufacturer),
                csv_field(&entry.part_number)
            );
        }

        csv
    }

    pub fn export_json(bom: &BOM) -> String {
        // Pre-allocate buffer for better performance on large BOMs
        let mut buffer = Vec::with_capacity(bom.entries.len() * 256);
        if serde_json::to_writer_pretty(&mut buffer, bom).is_ok() {
            String::from_utf8(buffer).unwrap_or_default()
        } else {
            String::new()
        }
    }
}

fn csv_field(value: &str) -> String {
    if value.contains([',', '"', '\n', '\r']) {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
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
        assert!(gerber.contains("%FSLAX26Y26*%"));
        assert!(gerber.contains("M02*"));
    }

    #[test]
    fn gerber_uses_units_and_non_degenerate_geometry() {
        let mut model = DomainModel::new("test");
        let id = foundation_core::ComponentId::new();
        let _previous = model.components.insert(
            id,
            domain_core::Component {
                id,
                name: "R1".into(),
                position: foundation_core::Point2i::new(10_000, 20_000),
                layer: 0,
                width_um: 2_000,
                height_um: 1_000,
                rotation_deg: 0,
                power_mw: 0.0,
                voltage_v: 3.3,
                package: "0603".into(),
                category: "resistor".into(),
                value: "10k".into(),
                manufacturer: String::new(),
                part_number: String::new(),
            },
        );
        let exporter = GerberExporter::new(GerberExportConfig {
            unit: GerberUnit::Inches,
            ..Default::default()
        });
        let gerber = exporter.generate_layer(&model, 0);
        assert!(gerber.contains("%MOIN*%"));
        assert!(gerber.contains("D03*"));
        assert!(gerber.lines().filter(|line| line.ends_with("D01*")).count() >= 4);
    }

    #[test]
    fn bom_csv_escapes_special_fields() {
        let bom = BOM {
            total_parts: 2,
            unique_parts: 1,
            entries: vec![BOMEntry {
                designator: "R1, R2".into(),
                value: "10k\n1%".into(),
                package: "0603\"thin".into(),
                quantity: 2,
                manufacturer: String::new(),
                part_number: String::new(),
            }],
        };
        let csv = BOMGenerator::export_csv(&bom);
        assert!(csv.contains("\"R1, R2\""));
        assert!(csv.contains("\"10k\n1%\""));
        assert!(csv.contains("\"0603\"\"thin\""));
    }

    #[test]
    fn bom_generator_creates_entries() {
        let model = DomainModel::new("test");
        let bom = BOMGenerator::generate(&model);
        assert_eq!(bom.total_parts, 0);
        assert_eq!(bom.unique_parts, 0);
    }
}
