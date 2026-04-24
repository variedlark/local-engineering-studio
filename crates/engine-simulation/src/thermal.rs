use domain_core::{Component, DomainModel};
use foundation_core::Point2i;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThermalConfig {
    /// Ambient temperature in Celsius
    pub ambient_temp_c: f64,
    /// Thermal resistance from junction to ambient (°C/W)
    pub theta_ja: f64,
    /// PCB thermal conductivity (W/m·K)
    pub pcb_conductivity: f64,
    /// Grid resolution for thermal simulation (micrometers)
    pub grid_resolution_um: i64,
}

impl Default for ThermalConfig {
    fn default() -> Self {
        Self {
            ambient_temp_c: 25.0,
            theta_ja: 50.0, // Typical for small packages
            pcb_conductivity: 0.3, // Typical for FR-4
            grid_resolution_um: 1000,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ThermalPoint {
    pub position: Point2i,
    pub temperature_c: f64,
    pub power_density_mw_mm2: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThermalAnalysisResult {
    pub thermal_map: Vec<ThermalPoint>,
    pub max_temperature_c: f64,
    pub min_temperature_c: f64,
    pub avg_temperature_c: f64,
    pub hotspots: Vec<HotSpot>,
    pub total_power_mw: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotSpot {
    pub component_name: String,
    pub temperature_c: f64,
    pub power_mw: f64,
    pub position: Point2i,
    pub risk_level: RiskLevel,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RiskLevel {
    Safe,      // < 60°C
    Warm,      // 60-80°C
    Hot,       // 80-100°C
    Critical,  // > 100°C
}

/// Thermal Analysis Engine: Simulates heat dissipation across the PCB
pub struct ThermalAnalyzer {
    config: ThermalConfig,
}

impl ThermalAnalyzer {
    #[must_use]
    pub fn new(config: ThermalConfig) -> Self {
        Self { config }
    }

    /// Analyze thermal characteristics of the design
    pub fn analyze(&self, model: &DomainModel) -> ThermalAnalysisResult {
        let total_power_mw = model.total_power_mw();

        // Calculate temperature for each component
        let mut component_temps: HashMap<String, f64> = HashMap::new();
        let mut thermal_points = Vec::new();

        for comp in model.components.values() {
            if comp.power_mw <= 0.0 {
                component_temps.insert(comp.name.clone(), self.config.ambient_temp_c);
                continue;
            }

            // Calculate junction temperature using thermal resistance
            // T_j = T_a + P * θ_ja
            let junction_temp = self.config.ambient_temp_c + (comp.power_mw / 1000.0) * self.config.theta_ja;
            component_temps.insert(comp.name.clone(), junction_temp);

            // Create thermal point for this component
            thermal_points.push(ThermalPoint {
                position: comp.position,
                temperature_c: junction_temp,
                power_density_mw_mm2: self.calculate_power_density(comp),
            });
        }

        // Identify hotspots
        let mut hotspots = Vec::new();
        for comp in model.components.values() {
            if let Some(&temp) = component_temps.get(&comp.name) {
                let risk_level = match temp {
                    t if t < 60.0 => RiskLevel::Safe,
                    t if t < 80.0 => RiskLevel::Warm,
                    t if t < 100.0 => RiskLevel::Hot,
                    _ => RiskLevel::Critical,
                };

                if risk_level != RiskLevel::Safe {
                    hotspots.push(HotSpot {
                        component_name: comp.name.clone(),
                        temperature_c: temp,
                        power_mw: comp.power_mw,
                        position: comp.position,
                        risk_level,
                    });
                }
            }
        }

        // Sort hotspots by temperature (hottest first)
        hotspots.sort_by(|a, b| b.temperature_c.partial_cmp(&a.temperature_c).unwrap());

        let max_temp = thermal_points.iter().map(|p| p.temperature_c).fold(f64::NEG_INFINITY, f64::max);
        let min_temp = thermal_points.iter().map(|p| p.temperature_c).fold(f64::INFINITY, f64::min);
        let avg_temp = if !thermal_points.is_empty() {
            thermal_points.iter().map(|p| p.temperature_c).sum::<f64>() / thermal_points.len() as f64
        } else {
            self.config.ambient_temp_c
        };

        ThermalAnalysisResult {
            thermal_map: thermal_points,
            max_temperature_c: max_temp,
            min_temperature_c: min_temp,
            avg_temperature_c: avg_temp,
            hotspots,
            total_power_mw,
        }
    }

    fn calculate_power_density(&self, comp: &Component) -> f64 {
        if comp.width_um <= 0 || comp.height_um <= 0 {
            return 0.0;
        }

        // Convert to mm²
        let area_mm2 = ((comp.width_um as f64) / 1000.0) * ((comp.height_um as f64) / 1000.0);
        if area_mm2 <= 0.0 {
            return 0.0;
        }

        comp.power_mw / area_mm2
    }

    /// Estimate cooling requirements based on thermal analysis
    pub fn estimate_cooling_requirements(result: &ThermalAnalysisResult) -> CoolingRequirements {
        let max_temp = result.max_temperature_c;
        let total_power = result.total_power_mw;

        let cooling_type = if max_temp < 60.0 {
            CoolingType::Passive
        } else if max_temp < 85.0 {
            CoolingType::PassiveWithAirflow
        } else if max_temp < 100.0 {
            CoolingType::ActiveCooling
        } else {
            CoolingType::LiquidCooling
        };

        let required_airflow_cfm = if total_power > 0.0 {
            ((max_temp - 25.0) / 0.5).max(0.0) // Rough estimate
        } else {
            0.0
        };

        CoolingRequirements {
            cooling_type,
            required_airflow_cfm,
            recommended_heatsink: max_temp > 80.0,
            critical_components: result.hotspots.iter().filter(|h| h.risk_level == RiskLevel::Critical).count(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoolingRequirements {
    pub cooling_type: CoolingType,
    pub required_airflow_cfm: f64,
    pub recommended_heatsink: bool,
    pub critical_components: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CoolingType {
    Passive,
    PassiveWithAirflow,
    ActiveCooling,
    LiquidCooling,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn thermal_analyzer_calculates_temperatures() {
        let config = ThermalConfig::default();
        let analyzer = ThermalAnalyzer::new(config);
        let model = DomainModel::new("test");
        let result = analyzer.analyze(&model);
        assert_eq!(result.total_power_mw, 0.0);
    }
}
