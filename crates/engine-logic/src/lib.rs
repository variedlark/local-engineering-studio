use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use rayon::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogicGate {
    And,
    Or,
    Xor,
    Nand,
    Nor,
    Not,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogicLevel {
    Low,
    High,
    Undefined,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogicNode {
    pub id: String,
    pub gate_type: LogicGate,
    pub inputs: Vec<String>,
    pub output: String,
    pub current_state: LogicLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogicCircuit {
    pub nodes: HashMap<String, LogicNode>,
    pub connections: Vec<(String, String)>, // (from_output, to_input)
    pub clock_frequency_mhz: f64,
}

impl LogicCircuit {
    #[must_use]
    pub fn new(clock_frequency_mhz: f64) -> Self {
        Self {
            nodes: HashMap::new(),
            connections: Vec::new(),
            clock_frequency_mhz,
        }
    }

    pub fn add_node(&mut self, node: LogicNode) {
        self.nodes.insert(node.id.clone(), node);
    }

    pub fn connect(&mut self, from: String, to: String) {
        self.connections.push((from, to));
    }

    /// Simulate one clock cycle
    pub fn simulate_cycle(&mut self, inputs: &HashMap<String, LogicLevel>) -> HashMap<String, LogicLevel> {
        let mut outputs = HashMap::new();

        // Set input values
        for (input_id, level) in inputs {
            outputs.insert(input_id.clone(), *level);
        }

        // Simulate logic gates in parallel
        let node_ids: Vec<_> = self.nodes.keys().cloned().collect();
        let results: Vec<_> = node_ids
            .par_iter()
            .map(|node_id| {
                let node = &self.nodes[node_id];
                let input_levels: Vec<_> = node
                    .inputs
                    .iter()
                    .filter_map(|input_id| outputs.get(input_id).copied())
                    .collect();

                let output_level = self.evaluate_gate(node.gate_type, &input_levels);
                (node.output.clone(), output_level)
            })
            .collect();

        for (output_id, level) in results {
            outputs.insert(output_id, level);
        }

        outputs
    }

    fn evaluate_gate(&self, gate: LogicGate, inputs: &[LogicLevel]) -> LogicLevel {
        match gate {
            LogicGate::And => {
                if inputs.is_empty() || inputs.iter().any(|&l| l == LogicLevel::Low) {
                    LogicLevel::Low
                } else if inputs.iter().all(|&l| l == LogicLevel::High) {
                    LogicLevel::High
                } else {
                    LogicLevel::Undefined
                }
            }
            LogicGate::Or => {
                if inputs.iter().any(|&l| l == LogicLevel::High) {
                    LogicLevel::High
                } else if inputs.iter().all(|&l| l == LogicLevel::Low) {
                    LogicLevel::Low
                } else {
                    LogicLevel::Undefined
                }
            }
            LogicGate::Xor => {
                let high_count = inputs.iter().filter(|&&l| l == LogicLevel::High).count();
                if inputs.iter().any(|&l| l == LogicLevel::Undefined) {
                    LogicLevel::Undefined
                } else if high_count % 2 == 1 {
                    LogicLevel::High
                } else {
                    LogicLevel::Low
                }
            }
            LogicGate::Nand => {
                let and_result = self.evaluate_gate(LogicGate::And, inputs);
                match and_result {
                    LogicLevel::High => LogicLevel::Low,
                    LogicLevel::Low => LogicLevel::High,
                    LogicLevel::Undefined => LogicLevel::Undefined,
                }
            }
            LogicGate::Nor => {
                let or_result = self.evaluate_gate(LogicGate::Or, inputs);
                match or_result {
                    LogicLevel::High => LogicLevel::Low,
                    LogicLevel::Low => LogicLevel::High,
                    LogicLevel::Undefined => LogicLevel::Undefined,
                }
            }
            LogicGate::Not => {
                if inputs.len() != 1 {
                    return LogicLevel::Undefined;
                }
                match inputs[0] {
                    LogicLevel::High => LogicLevel::Low,
                    LogicLevel::Low => LogicLevel::High,
                    LogicLevel::Undefined => LogicLevel::Undefined,
                }
            }
        }
    }

    /// Analyze circuit timing and critical path
    pub fn analyze_timing(&self) -> TimingAnalysis {
        let mut max_depth = 0;
        let mut critical_path = Vec::new();

        for (node_id, node) in &self.nodes {
            let depth = self.calculate_depth(node_id, &mut HashMap::new());
            if depth > max_depth {
                max_depth = depth;
                critical_path = vec![node_id.clone()];
            }
        }

        let gate_delay_ns = 0.1; // Typical gate delay
        let critical_path_delay_ns = max_depth as f64 * gate_delay_ns;
        let max_frequency_mhz = 1000.0 / critical_path_delay_ns;

        TimingAnalysis {
            critical_path,
            critical_path_delay_ns,
            max_frequency_mhz,
            current_frequency_mhz: self.clock_frequency_mhz,
            timing_margin_percent: ((max_frequency_mhz - self.clock_frequency_mhz) / max_frequency_mhz) * 100.0,
        }
    }

    fn calculate_depth(&self, node_id: &str, memo: &mut HashMap<String, usize>) -> usize {
        if let Some(&depth) = memo.get(node_id) {
            return depth;
        }

        let node = match self.nodes.get(node_id) {
            Some(n) => n,
            None => return 0,
        };

        let max_input_depth = node
            .inputs
            .iter()
            .map(|input_id| self.calculate_depth(input_id, memo))
            .max()
            .unwrap_or(0);

        let depth = max_input_depth + 1;
        memo.insert(node_id.to_string(), depth);
        depth
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingAnalysis {
    pub critical_path: Vec<String>,
    pub critical_path_delay_ns: f64,
    pub max_frequency_mhz: f64,
    pub current_frequency_mhz: f64,
    pub timing_margin_percent: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn logic_gate_and_works() {
        let circuit = LogicCircuit::new(100.0);
        let result = circuit.evaluate_gate(LogicGate::And, &[LogicLevel::High, LogicLevel::High]);
        assert_eq!(result, LogicLevel::High);

        let result = circuit.evaluate_gate(LogicGate::And, &[LogicLevel::High, LogicLevel::Low]);
        assert_eq!(result, LogicLevel::Low);
    }

    #[test]
    fn logic_gate_or_works() {
        let circuit = LogicCircuit::new(100.0);
        let result = circuit.evaluate_gate(LogicGate::Or, &[LogicLevel::High, LogicLevel::Low]);
        assert_eq!(result, LogicLevel::High);

        let result = circuit.evaluate_gate(LogicGate::Or, &[LogicLevel::Low, LogicLevel::Low]);
        assert_eq!(result, LogicLevel::Low);
    }

    #[test]
    fn timing_analysis_works() {
        let circuit = LogicCircuit::new(100.0);
        let analysis = circuit.analyze_timing();
        assert!(analysis.max_frequency_mhz > 0.0);
    }
}
