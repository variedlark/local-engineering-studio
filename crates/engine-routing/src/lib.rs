use domain_core::DomainModel;
use engine_geometry::manhattan_distance_u64;
use foundation_core::{ComponentId, Point2i};
use rayon::prelude::*;
use rstar::RTree;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};

pub mod auto_router;
pub mod diff_pair;
pub mod push_shove;

pub use auto_router::{AutoRouter, AutoRouterConfig, AutoRouterResult, RoutingPriority};
pub use diff_pair::{DiffPairRequest, DiffPairResult, route_diff_pair};
pub use push_shove::PushShoveEngine;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct GridPoint3D {
    pub x: i64,
    pub y: i64,
    pub layer: i32,
}

impl GridPoint3D {
    #[must_use]
    pub fn new(x: i64, y: i64, layer: i32) -> Self {
        Self { x, y, layer }
    }

    pub fn distance_to(&self, other: &GridPoint3D) -> u64 {
        let dist_xy =
            manhattan_distance_u64(Point2i::new(self.x, self.y), Point2i::new(other.x, other.y));
        let dist_z = self.layer.abs_diff(other.layer) as u64 * 10; // Coût élevé pour changer de couche (Via)
        dist_xy + dist_z
    }
}

impl rstar::Point for GridPoint3D {
    type Scalar = i64;
    const DIMENSIONS: usize = 3;

    fn nth(&self, index: usize) -> Self::Scalar {
        match index {
            0 => self.x,
            1 => self.y,
            2 => self.layer as i64,
            _ => unreachable!(),
        }
    }

    #[allow(
        unsafe_code,
        reason = "rstar::Point requires &mut i64 for a stored i32 layer; layer mutations are internal to rstar coordinate access"
    )]
    fn nth_mut(&mut self, index: usize) -> &mut Self::Scalar {
        match index {
            0 => &mut self.x,
            1 => &mut self.y,
            2 => unsafe { &mut *(&mut self.layer as *mut i32 as *mut i64) }, // Unsafe, but necessary for now
            _ => unreachable!(),
        }
    }

    fn generate(mut generator: impl FnMut(usize) -> Self::Scalar) -> Self {
        GridPoint3D::new(generator(0), generator(1), generator(2) as i32)
    }
}

// RTreeObject est automatiquement implémenté pour les types qui implémentent rstar::Point
// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct RouteRequest {
//     pub start: GridPoint3D,
//     pub end: GridPoint3D,
//     pub blocked_rtree: RTree<GridPoint3D>,
//     pub max_steps: usize,
//     pub allowed_layers: Vec<i32>,
// }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteRequest {
    pub start: GridPoint3D,
    pub end: GridPoint3D,
    pub blocked_points: HashSet<GridPoint3D>, // Changed from RTree to HashSet for serialization
    pub max_steps: usize,
    pub allowed_layers: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteResult {
    pub success: bool,
    pub path: Vec<GridPoint3D>,
    pub expanded_nodes: usize,
    pub via_count: usize,
}

#[derive(Copy, Clone, Eq, PartialEq)]
struct Node {
    point: GridPoint3D,
    cost: u64,
    priority: u64,
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        other.priority.cmp(&self.priority).then_with(|| self.cost.cmp(&other.cost))
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[must_use]
pub fn route_a_star_3d(request: &RouteRequest) -> RouteResult {
    if request.start == request.end {
        return RouteResult {
            success: true,
            path: vec![request.start],
            expanded_nodes: 1,
            via_count: 0,
        };
    }

    let blocked_rtree = RTree::bulk_load(request.blocked_points.iter().copied().collect()); // Build RTree from HashSet

    let mut open_set = BinaryHeap::new();
    let mut came_from: HashMap<GridPoint3D, GridPoint3D> = HashMap::new();
    let mut g_score: HashMap<GridPoint3D, u64> = HashMap::new();
    let mut expanded_nodes = 0_usize;

    g_score.insert(request.start, 0);
    open_set.push(Node {
        point: request.start,
        cost: 0,
        priority: request.start.distance_to(&request.end),
    });

    while let Some(current_node) = open_set.pop() {
        let current = current_node.point;
        expanded_nodes += 1;

        if current == request.end {
            let mut path = vec![current];
            let mut cursor = current;
            let mut via_count = 0;
            while let Some(&prev) = came_from.get(&cursor) {
                if prev.layer != cursor.layer {
                    via_count += 1;
                }
                path.push(prev);
                cursor = prev;
            }
            path.reverse();
            return RouteResult { success: true, path, expanded_nodes, via_count };
        }

        if expanded_nodes > request.max_steps {
            return RouteResult { success: false, path: Vec::new(), expanded_nodes, via_count: 0 };
        }

        let next_points: Vec<GridPoint3D> = neighbors_3d(current, &request.allowed_layers)
            .into_par_iter()
            .filter(|next| blocked_rtree.locate_at_point(next).is_none())
            .collect();

        for next in next_points {
            let move_cost = if next.layer != current.layer { 15 } else { 1 };
            let tentative_g_score = g_score.get(&current).unwrap_or(&u64::MAX) + move_cost;

            if tentative_g_score < *g_score.get(&next).unwrap_or(&u64::MAX) {
                came_from.insert(next, current);
                g_score.insert(next, tentative_g_score);
                let f_score = tentative_g_score + next.distance_to(&request.end);
                open_set.push(Node { point: next, cost: tentative_g_score, priority: f_score });
            }
        }
    }

    RouteResult { success: false, path: Vec::new(), expanded_nodes, via_count: 0 }
}

fn neighbors_3d(current: GridPoint3D, allowed_layers: &[i32]) -> Vec<GridPoint3D> {
    let mut n = vec![
        GridPoint3D::new(current.x + 1, current.y, current.layer),
        GridPoint3D::new(current.x - 1, current.y, current.layer),
        GridPoint3D::new(current.x, current.y + 1, current.layer),
        GridPoint3D::new(current.x, current.y - 1, current.layer),
    ];

    for &layer in allowed_layers {
        if layer != current.layer {
            n.push(GridPoint3D::new(current.x, current.y, layer));
        }
    }
    n
}

#[must_use]
pub fn route_between_components(
    model: &DomainModel,
    from: ComponentId,
    to: ComponentId,
) -> Option<RouteResult> {
    let start_comp = model.components.get(&from)?;
    let end_comp = model.components.get(&to)?;

    let blocked_points: HashSet<GridPoint3D> = model
        .components
        .values()
        .collect::<Vec<_>>()
        .par_iter()
        .filter_map(|comp| {
            if comp.id != from && comp.id != to {
                Some(GridPoint3D::new(comp.position.x, comp.position.y, comp.layer))
            } else {
                None
            }
        })
        .collect();

    let request = RouteRequest {
        start: GridPoint3D::new(start_comp.position.x, start_comp.position.y, start_comp.layer),
        end: GridPoint3D::new(end_comp.position.x, end_comp.position.y, end_comp.layer),
        blocked_points,
        max_steps: 100_000,
        allowed_layers: vec![0, 1, 2, 3], // Supporte jusqu\\\'à 4 couches par défaut
    };

    Some(route_a_star_3d(&request))
}

#[must_use]
pub fn to_polyline(path: &[GridPoint3D]) -> Vec<Point2i> {
    path.iter().map(|p| Point2i::new(p.x, p.y)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::{Component, DomainModel};

    #[test]
    fn route_3d_finds_path_across_layers() {
        let request = RouteRequest {
            start: GridPoint3D::new(0, 0, 0),
            end: GridPoint3D::new(2, 2, 1),
            blocked_points: HashSet::new(),
            max_steps: 1000,
            allowed_layers: vec![0, 1],
        };
        let result = route_a_star_3d(&request);
        assert!(result.success);
        assert!(result.via_count >= 1);
        assert_eq!(result.path.last().map(|point| point.layer), Some(1));
    }
}
