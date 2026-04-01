use domain_core::DomainModel;
use engine_geometry::manhattan_distance;
use foundation_core::ComponentId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ViolationKind {
    MinSpacing,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Violation {
    pub kind: ViolationKind,
    pub message: String,
    pub component_ids: Vec<ComponentId>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DrcReport {
    pub violations: Vec<Violation>,
    pub checked_pairs: usize,
}

#[must_use]
pub fn run_drc(model: &DomainModel) -> DrcReport {
    let mut violations = Vec::new();
    let mut checked_pairs = 0_usize;
    let components = model.components.values().collect::<Vec<_>>();

    for index in 0..components.len() {
        let a = components[index];
        for b in components.iter().skip(index + 1) {
            if a.layer != b.layer {
                continue;
            }
            checked_pairs += 1;
            let distance = manhattan_distance(a.position, b.position);
            if distance < model.rules.min_spacing_um {
                violations.push(Violation {
                    kind: ViolationKind::MinSpacing,
                    message: format!(
                        "Components {} and {} violate minimum spacing ({} < {})",
                        a.name, b.name, distance, model.rules.min_spacing_um
                    ),
                    component_ids: vec![a.id, b.id],
                });
            }
        }
    }

    DrcReport { violations, checked_pairs }
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::Component;
    use foundation_core::Point2i;

    #[test]
    fn drc_detects_spacing_violation() {
        let mut model = DomainModel::new("drc");
        model.rules.min_spacing_um = 100;

        let a = ComponentId::new();
        let b = ComponentId::new();

        let _a = model.components.insert(
            a,
            Component { id: a, name: "A".to_owned(), position: Point2i::new(0, 0), layer: 0 },
        );
        let _b = model.components.insert(
            b,
            Component { id: b, name: "B".to_owned(), position: Point2i::new(10, 10), layer: 0 },
        );

        let report = run_drc(&model);
        assert_eq!(report.checked_pairs, 1);
        assert_eq!(report.violations.len(), 1);
    }

    #[test]
    fn drc_ignores_cross_layer_spacing() {
        let mut model = DomainModel::new("drc-layer");
        model.rules.min_spacing_um = 100;

        let a = ComponentId::new();
        let b = ComponentId::new();

        let _a = model.components.insert(
            a,
            Component { id: a, name: "A".to_owned(), position: Point2i::new(0, 0), layer: 0 },
        );
        let _b = model.components.insert(
            b,
            Component { id: b, name: "B".to_owned(), position: Point2i::new(10, 10), layer: 1 },
        );

        let report = run_drc(&model);
        assert_eq!(report.checked_pairs, 0);
        assert_eq!(report.violations.len(), 0);
    }
}
