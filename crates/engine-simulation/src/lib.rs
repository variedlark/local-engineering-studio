use domain_core::DomainModel;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub time_step: f64,
    pub steps: usize,
    pub initial_energy: f64,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self { time_step: 0.01, steps: 128, initial_energy: 1.0 }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SimulationPoint {
    pub t: f64,
    pub value: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationReport {
    pub points: Vec<SimulationPoint>,
    pub stable: bool,
    pub summary: String,
}

#[must_use]
pub fn run_simulation(model: &DomainModel, config: SimulationConfig) -> SimulationReport {
    let load_factor = (model.components.len() as f64 + model.nets.len() as f64).max(1.0);
    let layer_entropy = {
        let mut counts = std::collections::HashMap::<i32, usize>::new();
        for component in model.components.values() {
            let entry = counts.entry(component.layer).or_insert(0);
            *entry += 1;
        }
        counts.len().max(1) as f64
    };
    let damping = 0.98_f64.powf(load_factor / 8.0);
    let mut points = Vec::with_capacity(config.steps);
    let mut value = config.initial_energy;

    for step in 0..config.steps {
        let t = step as f64 * config.time_step;
        let modulation = (step as f64 / (layer_entropy * 6.0)).sin() * 0.01;
        value = (value * damping) + modulation;
        points.push(SimulationPoint { t, value });
    }

    let stable = points.last().map_or(true, |point| point.value.abs() < 0.2);
    let summary = if stable {
        "System converges within configured horizon".to_owned()
    } else {
        "System remains energetic after configured horizon".to_owned()
    };

    SimulationReport { points, stable, summary }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simulation_produces_requested_number_of_points() {
        let model = DomainModel::new("sim");
        let config = SimulationConfig { time_step: 0.05, steps: 10, initial_energy: 2.0 };
        let report = run_simulation(&model, config);
        assert_eq!(report.points.len(), 10);
        assert!(report.points[0].value < 2.0);
    }
}
