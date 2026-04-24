use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ComponentSpec {
    pub part_number: String,
    pub manufacturer: String,
    pub description: String,
    pub category: String,
    pub subcategory: String,
    pub package: String,
    pub price_usd: f64,
    pub stock_available: bool,
    pub datasheet_url: String,
    pub specifications: HashMap<String, String>,
}

pub struct ComponentDatabase {
    components: HashMap<String, ComponentSpec>,
}

impl ComponentDatabase {
    #[must_use]
    pub fn new() -> Self {
        let mut db = Self {
            components: HashMap::new(),
        };
        db.populate_database();
        db
    }

    fn populate_database(&mut self) {
        // Microprocessors - RISC-V
        self.add_component(ComponentSpec {
            part_number: "SiFive-U74".to_string(),
            manufacturer: "SiFive".to_string(),
            description: "RISC-V 64-bit Dual-Core Processor".to_string(),
            category: "Microprocessor".to_string(),
            subcategory: "RISC-V 64-bit".to_string(),
            package: "BGA-196".to_string(),
            price_usd: 450.0,
            stock_available: true,
            datasheet_url: "https://sifive.com/u74-datasheet".to_string(),
            specifications: [
                ("Cores".to_string(), "2".to_string()),
                ("Frequency".to_string(), "1.5 GHz".to_string()),
                ("TDP".to_string(), "5W".to_string()),
            ].iter().cloned().collect(),
        });

        self.add_component(ComponentSpec {
            part_number: "SiFive-E31".to_string(),
            manufacturer: "SiFive".to_string(),
            description: "RISC-V 32-bit Single-Core Processor".to_string(),
            category: "Microprocessor".to_string(),
            subcategory: "RISC-V 32-bit".to_string(),
            package: "BGA-144".to_string(),
            price_usd: 200.0,
            stock_available: true,
            datasheet_url: "https://sifive.com/e31-datasheet".to_string(),
            specifications: [
                ("Cores".to_string(), "1".to_string()),
                ("Frequency".to_string(), "1.0 GHz".to_string()),
                ("TDP".to_string(), "2W".to_string()),
            ].iter().cloned().collect(),
        });

        // Memory - NAND Flash
        for capacity in &["256MB", "512MB", "1GB", "2GB"] {
            self.add_component(ComponentSpec {
                part_number: format!("SK-Hynix-NAND-{}", capacity),
                manufacturer: "SK Hynix".to_string(),
                description: format!("NAND Flash Memory {}", capacity),
                category: "Memory".to_string(),
                subcategory: "NAND Flash".to_string(),
                package: "BGA-63".to_string(),
                price_usd: 50.0 * (capacity.parse::<f64>().unwrap_or(1.0)),
                stock_available: true,
                datasheet_url: "https://skhynix.com/nand-datasheet".to_string(),
                specifications: [
                    ("Capacity".to_string(), capacity.to_string()),
                    ("Interface".to_string(), "eMMC 5.1".to_string()),
                    ("Speed".to_string(), "200 MB/s".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Memory - DRAM
        for capacity in &["512MB", "1GB", "2GB", "4GB", "8GB"] {
            self.add_component(ComponentSpec {
                part_number: format!("Micron-LPDDR4-{}", capacity),
                manufacturer: "Micron".to_string(),
                description: format!("LPDDR4 DRAM {}", capacity),
                category: "Memory".to_string(),
                subcategory: "DRAM".to_string(),
                package: "BGA-96".to_string(),
                price_usd: 30.0 * (capacity.parse::<f64>().unwrap_or(1.0)),
                stock_available: true,
                datasheet_url: "https://micron.com/lpddr4-datasheet".to_string(),
                specifications: [
                    ("Capacity".to_string(), capacity.to_string()),
                    ("Frequency".to_string(), "3200 MHz".to_string()),
                    ("Power".to_string(), "Low".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Analog ICs - Power Management
        self.add_component(ComponentSpec {
            part_number: "TI-TPS65217".to_string(),
            manufacturer: "Texas Instruments".to_string(),
            description: "Power Management IC - Multi-Output".to_string(),
            category: "Analog IC".to_string(),
            subcategory: "Power Management".to_string(),
            package: "BGA-40".to_string(),
            price_usd: 15.0,
            stock_available: true,
            datasheet_url: "https://ti.com/tps65217-datasheet".to_string(),
            specifications: [
                ("Outputs".to_string(), "4".to_string()),
                ("Efficiency".to_string(), "95%".to_string()),
                ("Input Voltage".to_string(), "3.3-5V".to_string()),
            ].iter().cloned().collect(),
        });

        // Analog ICs - Voltage Regulators
        for voltage in &["1.2V", "1.8V", "3.3V", "5.0V"] {
            self.add_component(ComponentSpec {
                part_number: format!("NXP-LDO-{}", voltage),
                manufacturer: "NXP".to_string(),
                description: format!("Linear Voltage Regulator {}", voltage),
                category: "Analog IC".to_string(),
                subcategory: "Voltage Regulator".to_string(),
                package: "SOT-23".to_string(),
                price_usd: 0.50,
                stock_available: true,
                datasheet_url: "https://nxp.com/ldo-datasheet".to_string(),
                specifications: [
                    ("Output".to_string(), voltage.to_string()),
                    ("Current".to_string(), "500mA".to_string()),
                    ("Dropout".to_string(), "200mV".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Digital ICs - Logic Gates
        self.add_component(ComponentSpec {
            part_number: "TI-SN74HC00".to_string(),
            manufacturer: "Texas Instruments".to_string(),
            description: "Quad 2-Input NAND Gate".to_string(),
            category: "Digital IC".to_string(),
            subcategory: "Logic Gates".to_string(),
            package: "DIP-14".to_string(),
            price_usd: 0.25,
            stock_available: true,
            datasheet_url: "https://ti.com/sn74hc00-datasheet".to_string(),
            specifications: [
                ("Gates".to_string(), "4".to_string()),
                ("Inputs".to_string(), "2".to_string()),
                ("Speed".to_string(), "8 ns".to_string()),
            ].iter().cloned().collect(),
        });

        // Passive - Resistors (E12 Series)
        let resistor_values = vec![
            "10Ω", "12Ω", "15Ω", "18Ω", "22Ω", "27Ω", "33Ω", "39Ω", "47Ω", "56Ω", "68Ω", "82Ω",
            "100Ω", "120Ω", "150Ω", "180Ω", "220Ω", "270Ω", "330Ω", "390Ω", "470Ω", "560Ω", "680Ω", "820Ω",
            "1kΩ", "1.2kΩ", "1.5kΩ", "1.8kΩ", "2.2kΩ", "2.7kΩ", "3.3kΩ", "3.9kΩ", "4.7kΩ", "5.6kΩ", "6.8kΩ", "8.2kΩ",
            "10kΩ", "12kΩ", "15kΩ", "18kΩ", "22kΩ", "27kΩ", "33kΩ", "39kΩ", "47kΩ", "56kΩ", "68kΩ", "82kΩ",
            "100kΩ", "120kΩ", "150kΩ", "180kΩ", "220kΩ", "270kΩ", "330kΩ", "390kΩ", "470kΩ", "560kΩ", "680kΩ", "820kΩ",
            "1MΩ", "1.2MΩ", "1.5MΩ", "1.8MΩ", "2.2MΩ", "2.7MΩ", "3.3MΩ", "3.9MΩ", "4.7MΩ", "5.6MΩ", "6.8MΩ", "8.2MΩ",
        ];

        for value in resistor_values {
            self.add_component(ComponentSpec {
                part_number: format!("Yageo-RES-{}", value),
                manufacturer: "Yageo".to_string(),
                description: format!("Thin Film Resistor {}", value),
                category: "Passive".to_string(),
                subcategory: "Resistor".to_string(),
                package: "0805".to_string(),
                price_usd: 0.01,
                stock_available: true,
                datasheet_url: "https://yageo.com/resistor-datasheet".to_string(),
                specifications: [
                    ("Value".to_string(), value.to_string()),
                    ("Tolerance".to_string(), "1%".to_string()),
                    ("Power".to_string(), "0.25W".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Passive - Capacitors
        let capacitor_values = vec![
            "10pF", "100pF", "1nF", "10nF", "100nF", "1µF", "10µF", "100µF", "1mF", "10mF",
        ];

        for value in capacitor_values {
            self.add_component(ComponentSpec {
                part_number: format!("Samsung-CAP-{}", value),
                manufacturer: "Samsung".to_string(),
                description: format!("Ceramic Capacitor {}", value),
                category: "Passive".to_string(),
                subcategory: "Capacitor".to_string(),
                package: "0805".to_string(),
                price_usd: 0.02,
                stock_available: true,
                datasheet_url: "https://samsung.com/capacitor-datasheet".to_string(),
                specifications: [
                    ("Value".to_string(), value.to_string()),
                    ("Voltage".to_string(), "50V".to_string()),
                    ("Dielectric".to_string(), "X7R".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Passive - Inductors
        let inductor_values = vec![
            "1µH", "10µH", "100µH", "1mH", "10mH", "100mH",
        ];

        for value in inductor_values {
            self.add_component(ComponentSpec {
                part_number: format!("Murata-IND-{}", value),
                manufacturer: "Murata".to_string(),
                description: format!("Chip Inductor {}", value),
                category: "Passive".to_string(),
                subcategory: "Inductor".to_string(),
                package: "0805".to_string(),
                price_usd: 0.05,
                stock_available: true,
                datasheet_url: "https://murata.com/inductor-datasheet".to_string(),
                specifications: [
                    ("Value".to_string(), value.to_string()),
                    ("Current".to_string(), "100mA".to_string()),
                    ("Core".to_string(), "Ferrite".to_string()),
                ].iter().cloned().collect(),
            });
        }

        // Discrete Semiconductors - Diodes
        self.add_component(ComponentSpec {
            part_number: "ON-1N4148".to_string(),
            manufacturer: "ON Semiconductor".to_string(),
            description: "Fast Switching Diode".to_string(),
            category: "Discrete".to_string(),
            subcategory: "Diode".to_string(),
            package: "SOD-323".to_string(),
            price_usd: 0.05,
            stock_available: true,
            datasheet_url: "https://onsemi.com/1n4148-datasheet".to_string(),
            specifications: [
                ("Voltage".to_string(), "100V".to_string()),
                ("Current".to_string(), "200mA".to_string()),
                ("Speed".to_string(), "4ns".to_string()),
            ].iter().cloned().collect(),
        });

        // Discrete Semiconductors - Transistors
        self.add_component(ComponentSpec {
            part_number: "Fairchild-2N2222".to_string(),
            manufacturer: "Fairchild".to_string(),
            description: "NPN Bipolar Junction Transistor".to_string(),
            category: "Discrete".to_string(),
            subcategory: "Transistor".to_string(),
            package: "TO-92".to_string(),
            price_usd: 0.15,
            stock_available: true,
            datasheet_url: "https://fairchild.com/2n2222-datasheet".to_string(),
            specifications: [
                ("Type".to_string(), "NPN".to_string()),
                ("Voltage".to_string(), "30V".to_string()),
                ("Current".to_string(), "500mA".to_string()),
            ].iter().cloned().collect(),
        });

        // Connectors
        self.add_component(ComponentSpec {
            part_number: "TE-USB-TypeC".to_string(),
            manufacturer: "TE Connectivity".to_string(),
            description: "USB Type-C Connector".to_string(),
            category: "Connector".to_string(),
            subcategory: "USB".to_string(),
            package: "SMD-24".to_string(),
            price_usd: 0.50,
            stock_available: true,
            datasheet_url: "https://te.com/usb-c-datasheet".to_string(),
            specifications: [
                ("Type".to_string(), "USB 3.1".to_string()),
                ("Pins".to_string(), "24".to_string()),
                ("Current".to_string(), "5A".to_string()),
            ].iter().cloned().collect(),
        });

        self.add_component(ComponentSpec {
            part_number: "Amphenol-HDMI".to_string(),
            manufacturer: "Amphenol".to_string(),
            description: "HDMI Connector Type A".to_string(),
            category: "Connector".to_string(),
            subcategory: "Video".to_string(),
            package: "SMD-19".to_string(),
            price_usd: 0.75,
            stock_available: true,
            datasheet_url: "https://amphenol.com/hdmi-datasheet".to_string(),
            specifications: [
                ("Type".to_string(), "HDMI 2.1".to_string()),
                ("Pins".to_string(), "19".to_string()),
                ("Bandwidth".to_string(), "48 Gbps".to_string()),
            ].iter().cloned().collect(),
        });
    }

    fn add_component(&mut self, component: ComponentSpec) {
        self.components.insert(component.part_number.clone(), component);
    }

    #[must_use]
    pub fn search_by_category(&self, category: &str) -> Vec<&ComponentSpec> {
        self.components
            .values()
            .filter(|c| c.category.to_lowercase().contains(&category.to_lowercase()))
            .collect()
    }

    #[must_use]
    pub fn search_by_manufacturer(&self, manufacturer: &str) -> Vec<&ComponentSpec> {
        self.components
            .values()
            .filter(|c| c.manufacturer.to_lowercase().contains(&manufacturer.to_lowercase()))
            .collect()
    }

    #[must_use]
    pub fn search_by_part_number(&self, part_number: &str) -> Option<&ComponentSpec> {
        self.components.get(part_number)
    }

    #[must_use]
    pub fn get_all_components(&self) -> Vec<&ComponentSpec> {
        self.components.values().collect()
    }

    #[must_use]
    pub fn component_count(&self) -> usize {
        self.components.len()
    }
}

impl Default for ComponentDatabase {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn database_loads_components() {
        let db = ComponentDatabase::new();
        assert!(db.component_count() > 100);
    }

    #[test]
    fn search_by_category_works() {
        let db = ComponentDatabase::new();
        let resistors = db.search_by_category("Resistor");
        assert!(!resistors.is_empty());
    }

    #[test]
    fn search_by_manufacturer_works() {
        let db = ComponentDatabase::new();
        let ti_components = db.search_by_manufacturer("Texas Instruments");
        assert!(!ti_components.is_empty());
    }
}
