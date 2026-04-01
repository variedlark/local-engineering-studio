//! Graph analysis helpers for connectivity operations.

use domain_core::DomainModel;
use foundation_core::ComponentId;
use std::collections::{HashSet, VecDeque};

/// Returns all components reachable through net membership.
#[must_use]
pub fn reachable_components(model: &DomainModel, seed: ComponentId) -> HashSet<ComponentId> {
    if !model.components.contains_key(&seed) {
        return HashSet::new();
    }

    let mut visited = HashSet::from([seed]);
    let mut queue = VecDeque::from([seed]);

    while let Some(current) = queue.pop_front() {
        for net in model.nets.values() {
            if !net.members.contains(&current) {
                continue;
            }
            for member in &net.members {
                if visited.insert(*member) {
                    let _ = queue.push_back(*member);
                }
            }
        }
    }

    visited
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::{Component, DomainModel, Net};
    use foundation_core::{NetId, Point2i};

    #[test]
    fn reachable_components_returns_connected_subgraph() {
        let mut model = DomainModel::new("graph");
        let a = ComponentId::new();
        let b = ComponentId::new();
        let c = ComponentId::new();
        let d = ComponentId::new();

        for (id, name) in [(a, "a"), (b, "b"), (c, "c"), (d, "d")] {
            let _ = model.components.insert(
                id,
                Component { id, name: name.to_owned(), position: Point2i::new(0, 0), layer: 0 },
            );
        }

        let _ = model.nets.insert(
            NetId::new(),
            Net { id: NetId::new(), name: "n1".to_owned(), members: vec![a, b, c] },
        );

        let visited = reachable_components(&model, b);
        assert!(visited.contains(&a));
        assert!(visited.contains(&b));
        assert!(visited.contains(&c));
        assert!(!visited.contains(&d));
    }
}
