use domain_core::DomainModel;
use foundation_core::{ComponentId, Point2i};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct GridPoint {
    pub x: i64,
    pub y: i64,
}

impl GridPoint {
    #[must_use]
    pub fn new(x: i64, y: i64) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteRequest {
    pub start: GridPoint,
    pub end: GridPoint,
    pub blocked: HashSet<GridPoint>,
    pub max_steps: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteResult {
    pub success: bool,
    pub path: Vec<GridPoint>,
    pub expanded_nodes: usize,
}

#[derive(Debug, thiserror::Error)]
pub enum RoutingError {
    #[error("route search exceeded max steps")]
    MaxStepsExceeded,
}

#[must_use]
pub fn route_manhattan(request: &RouteRequest) -> RouteResult {
    if request.start == request.end {
        return RouteResult { success: true, path: vec![request.start], expanded_nodes: 1 };
    }

    let mut queue = VecDeque::from([request.start]);
    let mut visited = HashSet::from([request.start]);
    let mut parent: HashMap<GridPoint, GridPoint> = HashMap::new();
    let mut expanded_nodes = 0_usize;

    while let Some(current) = queue.pop_front() {
        expanded_nodes += 1;
        if expanded_nodes > request.max_steps {
            return RouteResult { success: false, path: Vec::new(), expanded_nodes };
        }

        for next in neighbors(current) {
            if request.blocked.contains(&next) || visited.contains(&next) {
                continue;
            }

            let _new = visited.insert(next);
            let _prev = parent.insert(next, current);

            if next == request.end {
                let mut path = vec![next];
                let mut cursor = next;
                while let Some(prev) = parent.get(&cursor) {
                    path.push(*prev);
                    cursor = *prev;
                    if cursor == request.start {
                        break;
                    }
                }
                path.reverse();
                return RouteResult { success: true, path, expanded_nodes };
            }

            queue.push_back(next);
        }
    }

    RouteResult { success: false, path: Vec::new(), expanded_nodes }
}

#[must_use]
pub fn route_between_components(
    model: &DomainModel,
    from: ComponentId,
    to: ComponentId,
) -> Option<RouteResult> {
    let start_component = model.components.get(&from)?;
    let end_component = model.components.get(&to)?;
    if start_component.layer != end_component.layer {
        return Some(RouteResult { success: false, path: Vec::new(), expanded_nodes: 0 });
    }

    let start = start_component.position;
    let end = end_component.position;
    let request = RouteRequest {
        start: GridPoint::new(start.x, start.y),
        end: GridPoint::new(end.x, end.y),
        blocked: HashSet::new(),
        max_steps: 20_000,
    };
    Some(route_manhattan(&request))
}

#[must_use]
pub fn to_polyline(path: &[GridPoint]) -> Vec<Point2i> {
    path.iter().map(|point| Point2i::new(point.x, point.y)).collect()
}

fn neighbors(current: GridPoint) -> [GridPoint; 4] {
    [
        GridPoint::new(current.x + 1, current.y),
        GridPoint::new(current.x - 1, current.y),
        GridPoint::new(current.x, current.y + 1),
        GridPoint::new(current.x, current.y - 1),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::{Component, DomainModel};

    #[test]
    fn route_manhattan_finds_a_path() {
        let request = RouteRequest {
            start: GridPoint::new(0, 0),
            end: GridPoint::new(2, 0),
            blocked: HashSet::new(),
            max_steps: 64,
        };
        let result = route_manhattan(&request);
        assert!(result.success);
        assert_eq!(result.path.first().copied(), Some(GridPoint::new(0, 0)));
        assert_eq!(result.path.last().copied(), Some(GridPoint::new(2, 0)));
    }

    #[test]
    fn route_between_components_uses_component_positions() {
        let mut model = DomainModel::new("routing");
        let a = ComponentId::new();
        let b = ComponentId::new();
        let _replaced_a = model.components.insert(
            a,
            Component { id: a, name: "a".to_owned(), position: Point2i::new(1, 1), layer: 0 },
        );
        let _replaced_b = model.components.insert(
            b,
            Component { id: b, name: "b".to_owned(), position: Point2i::new(3, 1), layer: 0 },
        );
        let result = route_between_components(&model, a, b).expect("route");
        assert!(result.success);
    }

    #[test]
    fn route_between_components_fails_for_cross_layer() {
        let mut model = DomainModel::new("routing-layer");
        let a = ComponentId::new();
        let b = ComponentId::new();
        let _replaced_a = model.components.insert(
            a,
            Component { id: a, name: "a".to_owned(), position: Point2i::new(1, 1), layer: 0 },
        );
        let _replaced_b = model.components.insert(
            b,
            Component { id: b, name: "b".to_owned(), position: Point2i::new(3, 1), layer: 1 },
        );

        let result = route_between_components(&model, a, b).expect("route");
        assert!(!result.success);
        assert!(result.path.is_empty());
    }
}
