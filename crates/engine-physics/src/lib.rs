use rayon::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceProperties {
    pub length_mm: f64,
    pub width_mm: f64,
    pub thickness_mm: f64,
    pub dielectric_constant: f64,
    pub loss_tangent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalIntegrityAnalysis {
    pub characteristic_impedance_ohms: f64,
    pub propagation_delay_ns: f64,
    pub rise_time_ns: f64,
    pub overshoot_percent: f64,
    pub undershoot_percent: f64,
    pub crosstalk_risk: CrosstalkRisk,
    pub signal_quality: SignalQuality,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CrosstalkRisk {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignalQuality {
    Excellent,
    Good,
    Acceptable,
    Poor,
    Unacceptable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViaProperties {
    pub diameter_mm: f64,
    pub pad_diameter_mm: f64,
    pub drill_diameter_mm: f64,
    pub resistance_mohms: f64,
    pub inductance_nh: f64,
    pub capacitance_pf: f64,
}

pub const SPEED_OF_LIGHT_MM_NS: f64 = 299.792458; // mm/ns

pub struct SignalIntegrityEngine;

impl SignalIntegrityEngine {
    /// Analyze signal integrity for a routed trace and classify quality risks.
    pub fn analyze_trace(
        trace: &TraceProperties,
        driver_impedance: f64,
        load_impedance: f64,
    ) -> SignalIntegrityAnalysis {
        let characteristic_impedance = Self::calculate_impedance(trace);
        let propagation_delay = Self::calculate_propagation_delay(trace);
        let rise_time = Self::calculate_rise_time(trace);
        let (overshoot, undershoot) =
            Self::calculate_reflections(characteristic_impedance, driver_impedance, load_impedance);

        let crosstalk_risk = if trace.length_mm > 100.0 {
            CrosstalkRisk::High
        } else if trace.length_mm > 50.0 {
            CrosstalkRisk::Medium
        } else {
            CrosstalkRisk::Low
        };

        let signal_quality = Self::assess_signal_quality(overshoot, undershoot, rise_time);

        SignalIntegrityAnalysis {
            characteristic_impedance_ohms: characteristic_impedance,
            propagation_delay_ns: propagation_delay,
            rise_time_ns: rise_time,
            overshoot_percent: overshoot,
            undershoot_percent: undershoot,
            crosstalk_risk,
            signal_quality,
        }
    }

    fn calculate_impedance(trace: &TraceProperties) -> f64 {
        // Simplified impedance calculation for microstrip
        // Z0 = (87 / sqrt(Er + 1.41)) * ln(5.98 * h / (0.8 * w))
        let h = trace.thickness_mm.max(f64::EPSILON);
        let w = trace.width_mm.max(f64::EPSILON);
        let er = trace.dielectric_constant.max(f64::EPSILON);

        let numerator = 87.0 / (er + 1.41).sqrt();
        let denominator = (5.98 * h / (0.8 * w)).max(f64::EPSILON).ln();

        numerator * denominator
    }

    fn calculate_propagation_delay(trace: &TraceProperties) -> f64 {
        // Propagation delay = length / velocity
        // Velocity = c / sqrt(Er)
        let velocity = SPEED_OF_LIGHT_MM_NS / trace.dielectric_constant.max(f64::EPSILON).sqrt();
        trace.length_mm.max(0.0) / velocity
    }

    fn calculate_rise_time(trace: &TraceProperties) -> f64 {
        // Rise time affected by trace length and loss
        let base_rise_time = 0.5; // ns
        let length_factor = trace.length_mm / 100.0;
        let loss_factor = trace.loss_tangent * 10.0;

        base_rise_time * (1.0 + length_factor + loss_factor)
    }

    fn calculate_reflections(z0: f64, z_driver: f64, z_load: f64) -> (f64, f64) {
        // Reflection coefficient at driver and load
        let rho_driver = (z_driver - z0) / (z_driver + z0);
        let rho_load = (z_load - z0) / (z_load + z0);

        let overshoot = (rho_driver.abs() + rho_load.abs()) * 100.0;
        let undershoot = (rho_driver.abs() - rho_load.abs()).abs() * 100.0;

        (overshoot.min(50.0), undershoot.min(30.0))
    }

    fn assess_signal_quality(overshoot: f64, undershoot: f64, rise_time: f64) -> SignalQuality {
        let total_distortion = overshoot + undershoot;

        if total_distortion < 5.0 && rise_time < 1.0 {
            SignalQuality::Excellent
        } else if total_distortion < 10.0 && rise_time < 2.0 {
            SignalQuality::Good
        } else if total_distortion < 20.0 && rise_time < 3.0 {
            SignalQuality::Acceptable
        } else if total_distortion < 30.0 && rise_time < 5.0 {
            SignalQuality::Poor
        } else {
            SignalQuality::Unacceptable
        }
    }

    /// Analyze via properties and estimate lumped impedance and resonance effects.
    pub fn analyze_via(via: &ViaProperties) -> ViaAnalysis {
        let total_impedance = via.resistance_mohms as f64 / 1000.0
            + (via.inductance_nh as f64 * 2.0 * std::f64::consts::PI * 1e9) / 1e9;

        let resonant_frequency = 1.0
            / (2.0
                * std::f64::consts::PI
                * (via.inductance_nh as f64 * via.capacitance_pf as f64).sqrt());

        ViaAnalysis {
            total_impedance_ohms: total_impedance,
            resonant_frequency_ghz: resonant_frequency / 1e9,
            quality_factor: resonant_frequency / (via.resistance_mohms as f64 / 1000.0),
        }
    }

    /// Detect potential crosstalk pairs between traces for a given spacing.
    pub fn detect_crosstalk(traces: &[TraceProperties], spacing_mm: f64) -> Vec<CrosstalkWarning> {
        let mut warnings = Vec::new();

        let results: Vec<_> = traces
            .par_iter()
            .enumerate()
            .flat_map(|(i, trace1)| {
                traces
                    .iter()
                    .enumerate()
                    .filter(|(j, _)| j > &i)
                    .filter_map(|(_, trace2)| {
                        let coupling_factor = Self::calculate_coupling(trace1, trace2, spacing_mm);
                        if coupling_factor > 0.1 {
                            Some(CrosstalkWarning {
                                severity: if coupling_factor > 0.3 {
                                    CrosstalkSeverity::Critical
                                } else if coupling_factor > 0.2 {
                                    CrosstalkSeverity::High
                                } else {
                                    CrosstalkSeverity::Medium
                                },
                                coupling_factor,
                                recommended_spacing_mm: spacing_mm * (coupling_factor + 1.0),
                            })
                        } else {
                            None
                        }
                    })
                    .collect::<Vec<_>>()
            })
            .collect();

        warnings.extend(results);
        warnings
    }

    fn calculate_coupling(trace1: &TraceProperties, trace2: &TraceProperties, spacing: f64) -> f64 {
        // Simplified coupling calculation
        let length_factor = (trace1.length_mm.min(trace2.length_mm)) / 100.0;
        let spacing_factor = 1.0 / (1.0 + spacing);
        let width_factor = (trace1.width_mm + trace2.width_mm) / 10.0;

        (length_factor * spacing_factor * width_factor).min(1.0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViaAnalysis {
    pub total_impedance_ohms: f64,
    pub resonant_frequency_ghz: f64,
    pub quality_factor: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrosstalkWarning {
    pub severity: CrosstalkSeverity,
    pub coupling_factor: f64,
    pub recommended_spacing_mm: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CrosstalkSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn impedance_calculation_works() {
        let trace = TraceProperties {
            length_mm: 50.0,
            width_mm: 0.2,
            thickness_mm: 0.1,
            dielectric_constant: 4.5,
            loss_tangent: 0.02,
        };

        let z0 = SignalIntegrityEngine::calculate_impedance(&trace);
        assert!(z0 > 0.0);
        assert!(z0 < 200.0); // Typical range
    }

    #[test]
    fn impedance_calculation_handles_zero_width() {
        let trace = TraceProperties {
            length_mm: 50.0,
            width_mm: 0.0,
            thickness_mm: 0.1,
            dielectric_constant: 4.5,
            loss_tangent: 0.02,
        };

        let z0 = SignalIntegrityEngine::calculate_impedance(&trace);
        assert!(z0.is_finite());
    }

    #[test]
    fn propagation_delay_calculation_works() {
        let trace = TraceProperties {
            length_mm: 100.0,
            width_mm: 0.2,
            thickness_mm: 0.1,
            dielectric_constant: 4.5,
            loss_tangent: 0.02,
        };

        let delay = SignalIntegrityEngine::calculate_propagation_delay(&trace);
        assert!(delay > 0.0);
    }

    #[test]
    fn propagation_delay_handles_non_physical_dielectric() {
        let trace = TraceProperties {
            length_mm: 100.0,
            width_mm: 0.2,
            thickness_mm: 0.1,
            dielectric_constant: 0.0,
            loss_tangent: 0.02,
        };

        let delay = SignalIntegrityEngine::calculate_propagation_delay(&trace);
        assert!(delay.is_finite());
        assert!(delay >= 0.0);
    }
}
