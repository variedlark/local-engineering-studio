use domain_core::{Component, DomainModel, Net, RuleSet};
use engine_geometry::manhattan_distance;
use engine_physics::{SignalIntegrityEngine, TraceProperties, ViaProperties};
use foundation_core::ComponentId;
use foundation_core::Point2i;
use serde::{Deserialize, Serialize};
// HashMap removed as it was unused

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ViolationKind {
    MinSpacing,
    TraceWidth,
    ViaAnnularRing,
    CopperPour,
    AntennaEffect,
    AcidTraps,
    SignalIntegrity,
    ThermalRelief,
    ManufacturingConstraint,
    OpenCircuit,
    ShortCircuit,
    UnconnectedPin,
    SilkScreenOverPad,
    DrillToCopper,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ViolationSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Violation {
    pub kind: ViolationKind,
    pub severity: ViolationSeverity,
    pub message: String,
    pub component_ids: Vec<ComponentId>,
    pub related_points: Vec<Point2i>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DrcReport {
    pub violations: Vec<Violation>,
    pub checked_elements: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
}

#[must_use]
pub fn run_drc(model: &DomainModel) -> DrcReport {
    let mut violations = Vec::new();
    let mut checked_elements = 0_usize;

    // R-Tree optimization could be added here for large designs

    // Rule 1: Minimum Spacing between Components
    checked_elements += check_min_spacing(model, &mut violations);

    // Rule 2: Trace Width (simplified, needs actual trace data)
    checked_elements += check_trace_width(model, &mut violations);

    // Rule 3: Open Circuits (unconnected nets)
    checked_elements += check_open_circuits(model, &mut violations);

    // Rule 4: Signal Integrity (using engine-physics)
    checked_elements += check_signal_integrity(model, &mut violations);

    // Rule 5: Manufacturing Constraints (e.g., Acid Traps, Antenna Effect)
    checked_elements += check_manufacturing_constraints(model, &mut violations);

    // Rule 6: Short Circuits (simplified, needs actual trace data)
    checked_elements += check_short_circuits(model, &mut violations);

    // Rule 7: Unconnected Pins (simplified)
    checked_elements += check_unconnected_pins(model, &mut violations);

    // Rule 8: Silk Screen Over Pad (simplified)
    checked_elements += check_silkscreen_over_pad(model, &mut violations);

    // Rule 9: Drill to Copper (simplified)
    checked_elements += check_drill_to_copper(model, &mut violations);

    let error_count = violations.iter().filter(|v| v.severity == ViolationSeverity::Error).count();
    let warning_count =
        violations.iter().filter(|v| v.severity == ViolationSeverity::Warning).count();
    let info_count = violations.iter().filter(|v| v.severity == ViolationSeverity::Info).count();

    DrcReport { violations, checked_elements, error_count, warning_count, info_count }
}

fn check_min_spacing(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_pairs = 0;
    let components: Vec<&Component> = model.components.values().collect();

    for i in 0..components.len() {
        let a = components[i];
        for j in (i + 1)..components.len() {
            let b = components[j];
            if a.layer != b.layer {
                continue;
            }
            checked_pairs += 1;
            let distance = manhattan_distance(a.position, b.position);
            if distance < model.rules.min_spacing_um {
                violations.push(Violation {
                    kind: ViolationKind::MinSpacing,
                    severity: ViolationSeverity::Error,
                    message: format!(
                        "Components {} and {} violate minimum spacing ({} < {} um)",
                        a.name, b.name, distance, model.rules.min_spacing_um
                    ),
                    component_ids: vec![a.id, b.id],
                    related_points: vec![a.position, b.position],
                });
            }
        }
    }
    checked_pairs
}

fn check_trace_width(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_traces = 0;
    // Placeholder: In a real scenario, we'd iterate over actual trace data
    // For now, we'll simulate a check based on component density or net count
    if model.nets.len() > 5 && model.components.len() > 10 {
        checked_traces = 1;
        violations.push(Violation {
            kind: ViolationKind::TraceWidth,
            severity: ViolationSeverity::Warning,
            message: "Consider reviewing trace widths for power and signal integrity.".to_string(),
            component_ids: Vec::new(),
            related_points: Vec::new(),
        });
    }
    checked_traces
}

fn check_open_circuits(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_nets = 0;
    for net in model.nets.values() {
        checked_nets += 1;
        if net.members.len() < 2 {
            violations.push(Violation {
                kind: ViolationKind::OpenCircuit,
                severity: ViolationSeverity::Error,
                message: format!(
                    "Net '{}' has fewer than two members, indicating an open circuit.",
                    net.name
                ),
                component_ids: net.members.clone(),
                related_points: Vec::new(),
            });
        }
    }
    checked_nets
}

fn check_signal_integrity(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_signals = 0;
    // Simulate checking a few critical signals based on component types
    for comp in model.components.values() {
        if comp.category == "Microprocessor" || comp.category == "Memory" {
            checked_signals += 1;
            // Simulate a trace for SI analysis
            let trace = TraceProperties {
                length_mm: 150.0, // Assume a long trace for critical signals
                width_mm: 0.15,
                thickness_mm: 0.035,
                dielectric_constant: 4.2,
                loss_tangent: 0.02,
            };
            let analysis = SignalIntegrityEngine::analyze_trace(&trace, 50.0, 50.0);

            if analysis.signal_quality == engine_physics::SignalQuality::Poor
                || analysis.signal_quality == engine_physics::SignalQuality::Unacceptable
            {
                violations.push(Violation {
                    kind: ViolationKind::SignalIntegrity,
                    severity: ViolationSeverity::Error,
                    message: format!("Signal integrity issue detected for critical component '{}': Quality is {:?}. Overshoot: {:.1}%, Undershoot: {:.1}%", comp.name, analysis.signal_quality, analysis.overshoot_percent, analysis.undershoot_percent),
                    component_ids: vec![comp.id],
                    related_points: Vec::new(),
                });
            } else if analysis.signal_quality == engine_physics::SignalQuality::Acceptable {
                violations.push(Violation {
                    kind: ViolationKind::SignalIntegrity,
                    severity: ViolationSeverity::Warning,
                    message: format!("Signal integrity for component '{}' is only Acceptable. Consider improvements.", comp.name),
                    component_ids: vec![comp.id],
                    related_points: Vec::new(),
                });
            }
        }
    }
    checked_signals
}

fn check_manufacturing_constraints(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_constraints = 0;
    // Simulate checks for Acid Traps and Antenna Effect
    if model.components.len() > 5 {
        checked_constraints += 1;
        violations.push(Violation {
            kind: ViolationKind::AcidTraps,
            severity: ViolationSeverity::Warning,
            message: "Potential acid traps detected. Review acute angles in traces.".to_string(),
            component_ids: Vec::new(),
            related_points: Vec::new(),
        });

        checked_constraints += 1;
        violations.push(Violation {
            kind: ViolationKind::AntennaEffect,
            severity: ViolationSeverity::Warning,
            message: "Potential antenna effect detected. Ensure proper grounding for long traces."
                .to_string(),
            component_ids: Vec::new(),
            related_points: Vec::new(),
        });
    }
    checked_constraints
}

fn check_short_circuits(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_shorts = 0;
    let mut positions: Vec<(Point2i, i32, ComponentId)> = Vec::new();
    for comp in model.components.values() {
        checked_shorts += 1;
        if let Some((_, _, existing_comp_id)) =
            positions.iter().find(|(p, l, _)| *p == comp.position && *l == comp.layer)
        {
            violations.push(Violation {
                kind: ViolationKind::ShortCircuit,
                severity: ViolationSeverity::Error,
                message: format!("Components '{}' and '{}' are at the same position on layer {}. Potential short circuit.",
                                 model.components
                                     .get(existing_comp_id)
                                     .map_or("<unknown>", |component| component.name.as_str()),
                                 comp.name,
                                 comp.layer),
                component_ids: vec![*existing_comp_id, comp.id],
                related_points: vec![comp.position],
            });
        } else {
            positions.push((comp.position, comp.layer, comp.id));
        }
    }
    checked_shorts
}

fn check_unconnected_pins(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_pins = 0;
    // Simplified: Assume each component has 2 pins, check if they are connected to a net
    for comp in model.components.values() {
        checked_pins += 2; // Simulate 2 pins per component
        let connected_to_net = model.nets.values().any(|net| net.members.contains(&comp.id));
        if !connected_to_net {
            violations.push(Violation {
                kind: ViolationKind::UnconnectedPin,
                severity: ViolationSeverity::Warning,
                message: format!(
                    "Component '{}' has unconnected pins. Review net connections.",
                    comp.name
                ),
                component_ids: vec![comp.id],
                related_points: Vec::new(),
            });
        }
    }
    checked_pins
}

fn check_silkscreen_over_pad(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_silkscreen = 0;
    // Simplified: Assume any component with a large package might have silkscreen over pad issues
    for comp in model.components.values() {
        if comp.package.contains("BGA") || comp.package.contains("QFP") {
            checked_silkscreen += 1;
            violations.push(Violation {
                kind: ViolationKind::SilkScreenOverPad,
                severity: ViolationSeverity::Warning,
                message: format!("Potential silkscreen over pad for component '{}'. Review placement and package details.", comp.name),
                component_ids: vec![comp.id],
                related_points: Vec::new(),
            });
        }
    }
    checked_silkscreen
}

fn check_drill_to_copper(model: &DomainModel, violations: &mut Vec<Violation>) -> usize {
    let mut checked_drills = 0;
    // Simplified: Assume any via might have drill to copper issues if too close to a component
    for comp in model.components.values() {
        // Simulate a via near a component
        if comp.layer == 0 && comp.position.x < 100 && comp.position.y < 100 {
            checked_drills += 1;
            violations.push(Violation {
                kind: ViolationKind::DrillToCopper,
                severity: ViolationSeverity::Warning,
                message: format!("Potential drill to copper violation near component '{}'. Review via and pad clearances.", comp.name),
                component_ids: vec![comp.id],
                related_points: vec![comp.position],
            });
        }
    }
    checked_drills
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::{Component, Net, ProjectId, RuleSet};
    use foundation_core::{ComponentId, NetId, Point2i};

    fn create_test_model() -> DomainModel {
        let mut model = DomainModel::new("drc-test");
        model.rules = RuleSet { min_spacing_um: 50, grid_step_um: 10 };

        let comp_a_id = ComponentId::new_from_str("R1");
        let comp_b_id = ComponentId::new_from_str("C1");
        let comp_c_id = ComponentId::new_from_str("U1");
        let comp_d_id = ComponentId::new_from_str("LED1");

        model.components.insert(
            comp_a_id,
            Component {
                id: comp_a_id,
                name: "R1".to_owned(),
                position: Point2i::new(0, 0),
                layer: 0,
                width_um: 100,
                height_um: 50,
                rotation_deg: 0,
                power_mw: 10.0,
                voltage_v: 3.3,
                package: "0603".to_owned(),
                category: "Resistor".to_owned(),
            },
        );
        model.components.insert(
            comp_b_id,
            Component {
                id: comp_b_id,
                name: "C1".to_owned(),
                position: Point2i::new(40, 0),
                layer: 0,
                width_um: 100,
                height_um: 50,
                rotation_deg: 0,
                power_mw: 5.0,
                voltage_v: 3.3,
                package: "0603".to_owned(),
                category: "Capacitor".to_owned(),
            },
        );
        model.components.insert(
            comp_c_id,
            Component {
                id: comp_c_id,
                name: "U1".to_owned(),
                position: Point2i::new(100, 100),
                layer: 0,
                width_um: 500,
                height_um: 500,
                rotation_deg: 0,
                power_mw: 500.0,
                voltage_v: 3.3,
                package: "BGA-144".to_owned(),
                category: "Microprocessor".to_owned(),
            },
        );
        model.components.insert(
            comp_d_id,
            Component {
                id: comp_d_id,
                name: "LED1".to_owned(),
                position: Point2i::new(200, 200),
                layer: 0,
                width_um: 100,
                height_um: 50,
                rotation_deg: 0,
                power_mw: 20.0,
                voltage_v: 2.0,
                package: "0805".to_owned(),
                category: "LED".to_owned(),
            },
        );

        let net_1_id = NetId::new_from_str("NET1");
        let net_2_id = NetId::new_from_str("NET2");
        let net_3_id = NetId::new_from_str("OPEN_NET");

        model.nets.insert(
            net_1_id,
            Net { id: net_1_id, name: "NET1".to_owned(), members: vec![comp_a_id, comp_b_id] },
        );
        model.nets.insert(
            net_2_id,
            Net { id: net_2_id, name: "NET2".to_owned(), members: vec![comp_c_id, comp_d_id] },
        );
        model.nets.insert(
            net_3_id,
            Net { id: net_3_id, name: "OPEN_NET".to_owned(), members: vec![comp_d_id] },
        );

        model
    }

    #[test]
    fn drc_detects_min_spacing_violation() {
        let mut model = create_test_model();
        // Create a violation by moving C1 too close to R1
        let c1 = model.components.get_mut(&ComponentId::new_from_str("C1")).unwrap();
        c1.position = Point2i::new(10, 10);

        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::MinSpacing));
        assert_eq!(report.error_count, 1);
    }

    #[test]
    fn drc_detects_trace_width_warning() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::TraceWidth));
        assert_eq!(report.warning_count, 1);
    }

    #[test]
    fn drc_detects_open_circuit() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::OpenCircuit));
        assert_eq!(report.error_count, 1);
    }

    #[test]
    fn drc_detects_crosstalk_warning() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::SignalIntegrity));
        assert!(report.warning_count >= 1 || report.error_count >= 1);
    }

    #[test]
    fn drc_detects_acid_trap_warning() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::AcidTraps));
        assert_eq!(report.warning_count, 1);
    }

    #[test]
    fn drc_detects_antenna_effect_warning() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::AntennaEffect));
        assert_eq!(report.warning_count, 1);
    }

    #[test]
    fn drc_detects_short_circuit_warning() {
        let model = create_test_model();
        let report = run_drc(&model);
        assert!(report.violations.iter().any(|v| v.kind == ViolationKind::ShortCircuit));
        assert_eq!(report.warning_count, 1);
    }
}
