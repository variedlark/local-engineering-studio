use domain_core::DomainModel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use rayon::prelude::*;

pub mod thermal;
pub use thermal::{ThermalAnalyzer, ThermalAnalysisResult, ThermalConfig, HotSpot, RiskLevel, CoolingRequirements, CoolingType};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub time_step: f64,
    pub steps: usize,
    pub initial_energy: f64,
    pub ambient_temp: f64,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self { 
            time_step: 0.001, 
            steps: 200, 
            initial_energy: 5.0, // 5V par défaut
            ambient_temp: 25.0 
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SimulationPoint {
    pub t: f64,
    pub voltage: f64,
    pub current: f64,
    pub power: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationReport {
    pub points: Vec<SimulationPoint>,
    pub stable: bool,
    pub max_voltage: f64,
    pub avg_power: f64,
    pub summary: String,
}

/// Un moteur de simulation électrique simplifié utilisant l'analyse nodale.
/// Pour l'instant, il simule la réponse transitoire d'un réseau RC équivalent
/// basé sur la complexité du modèle (nombre de composants et de connexions).
#[must_use]
pub fn run_simulation(model: &DomainModel, config: SimulationConfig) -> SimulationReport {
    let num_components = model.components.len() as f64;
    let num_nets = model.nets.len() as f64;
    
    // Paramètres physiques dérivés du design
    // Plus il y a de composants, plus la résistance et la capacité augmentent
    let resistance = (num_components * 10.0).max(1.0); // Ohms
    let capacitance = (num_nets * 1e-6).max(1e-9);    // Farads
    let tau = resistance * capacitance;               // Constante de temps RC
    
    let mut points = Vec::with_capacity(config.steps);
    let mut current_voltage = 0.0;
    let target_voltage = config.initial_energy;
    let mut total_power = 0.0;

    // Parallelisation de la boucle de simulation
    let (sim_points, sim_powers): (Vec<_>, Vec<_>) = (0..config.steps)
        .into_par_iter()
        .map(|step| {
            let t = step as f64 * config.time_step;
            let noise = (t * 1000.0).sin() * 0.005;
            let voltage = target_voltage * (1.0 - (-t / tau).exp()) + noise;
            let current = (target_voltage - voltage).max(0.0) / resistance;
            let power = voltage * current;
            (SimulationPoint { t, voltage, current, power }, power)
        })
        .unzip();

    points = sim_points;
    total_power = sim_powers.iter().sum();

    let stable = points.last().map_or(true, |p| (target_voltage - p.voltage).abs() < 0.1);
    let avg_power = if config.steps > 0 { total_power / config.steps as f64 } else { 0.0 };
    let max_voltage = points.iter().map(|p| p.voltage).fold(0.0, f64::max);

    let summary = format!(
        "Analyse transitoire terminée. Tau: {:.3}ms, Tension max: {:.2}V, Puissance moy: {:.2}mW",
        tau * 1000.0, max_voltage, avg_power * 1000.0
    );

    SimulationReport { 
        points, 
        stable, 
        max_voltage,
        avg_power,
        summary 
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simulation_calculates_electrical_values() {
        let model = DomainModel::new("electrical-test");
        let config = SimulationConfig::default();
        let report = run_simulation(&model, config);
        
        assert_eq!(report.points.len(), config.steps);
        assert!(report.max_voltage <= config.initial_energy + 0.1);
        assert!(report.avg_power >= 0.0);
    }
}
