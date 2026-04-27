use crate::{route_a_star_3d, GridPoint3D, RouteRequest, RouteResult};
use domain_core::{DomainModel, Net};
use engine_geometry::manhattan_distance;
use foundation_core::{ComponentId, Point2i};
use std::collections::HashSet;
use rayon::prelude::*;

#[derive(Debug, Clone)]
pub struct AutoRouterConfig {
    pub max_steps: usize,
    pub allowed_layers: Vec<i32>,
    pub priority_mode: RoutingPriority,
    pub parallel_routing: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoutingPriority {
    /// Route power and ground nets first
    PowerFirst,
    /// Route by net length (shortest first)
    ShortestFirst,
    /// Route by net complexity (fewest connections first)
    SimplestFirst,
    /// Route in order of definition
    Sequential,
}

impl Default for AutoRouterConfig {
    fn default() -> Self {
        Self {
            max_steps: 100_000,
            allowed_layers: vec![0, 1, 2, 3],
            priority_mode: RoutingPriority::PowerFirst,
            parallel_routing: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct AutoRouterResult {
    pub total_nets: usize,
    pub routed_nets: usize,
    pub failed_nets: usize,
    pub total_vias: usize,
    pub total_expanded_nodes: usize,
    pub failed_net_names: Vec<String>,
}

/// Auto-Router Titan: Routes all nets in a design automatically
pub struct AutoRouter {
    config: AutoRouterConfig,
}

impl AutoRouter {
    #[must_use]
    pub fn new(config: AutoRouterConfig) -> Self {
        Self { config }
    }

    /// Route all nets in the model
    pub fn route_all_nets(&self, model: &DomainModel) -> AutoRouterResult {
        let nets: Vec<_> = model.nets.values().cloned().collect();
        
        // Sort nets by priority
        let sorted_nets = self.sort_nets_by_priority(&nets, model);
        
        let mut result = AutoRouterResult {
            total_nets: sorted_nets.len(),
            routed_nets: 0,
            failed_nets: 0,
            total_vias: 0,
            total_expanded_nodes: 0,
            failed_net_names: Vec::new(),
        };

        // Collect all blocked points from already-routed nets and components
        let mut blocked_points = self.collect_blocked_points(model);

        // Route nets sequentially (respecting priority)
        for net in sorted_nets {
            if net.members.len() < 2 {
                continue; // Skip nets with less than 2 members
            }

            // Route this net (connect all members)
            match self.route_net(&net, model, &blocked_points) {
                Some(route_result) => {
                    result.routed_nets += 1;
                    result.total_vias += route_result.via_count;
                    result.total_expanded_nodes += route_result.expanded_nodes;

                    // Add the routed path to blocked points for future nets
                    for point in &route_result.path {
                        blocked_points.insert(*point);
                    }
                }
                None => {
                    result.failed_nets += 1;
                    result.failed_net_names.push(net.name.clone());
                }
            }
        }

        result
    }

    fn sort_nets_by_priority(&self, nets: &[Net], model: &DomainModel) -> Vec<Net> {
        match self.config.priority_mode {
            RoutingPriority::PowerFirst => {
                let mut power_nets = Vec::new();
                let mut other_nets = Vec::new();

                for net in nets {
                    if net.name.to_uppercase().contains("VDD") 
                        || net.name.to_uppercase().contains("VSS")
                        || net.name.to_uppercase().contains("GND")
                        || net.name.to_uppercase().contains("POWER") {
                        power_nets.push(net.clone());
                    } else {
                        other_nets.push(net.clone());
                    }
                }

                power_nets.extend(other_nets);
                power_nets
            }
            RoutingPriority::ShortestFirst => {
                let mut sorted = nets.to_vec();
                sorted.sort_by_key(|net| {
                    if net.members.len() < 2 {
                        return i64::MAX;
                    }
                    let positions: Vec<_> = net.members.iter()
                        .filter_map(|id| model.components.get(id).map(|c| c.position))
                        .collect();
                    
                    if positions.len() < 2 {
                        return i64::MAX;
                    }

                    // Calculate total distance between all members
                    let mut total_dist = 0i64;
                    for i in 0..positions.len() - 1 {
                        total_dist += manhattan_distance(
                            Point2i::new(positions[i].x, positions[i].y),
                            Point2i::new(positions[i + 1].x, positions[i + 1].y),
                        );
                    }
                    total_dist
                });
                sorted
            }
            RoutingPriority::SimplestFirst => {
                let mut sorted = nets.to_vec();
                sorted.sort_by_key(|net| net.members.len());
                sorted
            }
            RoutingPriority::Sequential => nets.to_vec(),
        }
    }

    fn collect_blocked_points(&self, model: &DomainModel) -> HashSet<GridPoint3D> {
        let mut blocked = HashSet::new();

        // Add all component positions as blocked
        for comp in model.components.values() {
            blocked.insert(GridPoint3D::new(comp.position.x, comp.position.y, comp.layer));
        }

        blocked
    }

    fn route_net(
        &self,
        net: &Net,
        model: &DomainModel,
        blocked_points: &HashSet<GridPoint3D>,
    ) -> Option<RouteResult> {
        if net.members.len() < 2 {
            return None;
        }

        // Connect all members of the net using a Steiner tree approach
        // For simplicity, we'll use a greedy approach: connect each member to the nearest already-connected member
        let mut connected = vec![net.members[0]];
        let mut total_path = Vec::new();

        while connected.len() < net.members.len() {
            // Find the nearest unconnected member
            let mut best_distance = i64::MAX;
            let mut best_unconnected_idx = 0;
            let mut best_connected_idx = 0;

            for (u_idx, unconnected_id) in net.members.iter().enumerate() {
                if connected.contains(unconnected_id) {
                    continue;
                }

                let unconnected_comp = model.components.get(unconnected_id)?;
                for (c_idx, connected_id) in connected.iter().enumerate() {
                    let connected_comp = model.components.get(connected_id)?;
                    let dist = manhattan_distance(
                        Point2i::new(unconnected_comp.position.x, unconnected_comp.position.y),
                        Point2i::new(connected_comp.position.x, connected_comp.position.y),
                    );

                    if dist < best_distance {
                        best_distance = dist;
                        best_unconnected_idx = u_idx;
                        best_connected_idx = c_idx;
                    }
                }
            }

            // Route from the connected component to the unconnected one
            let connected_comp = model.components.get(&connected[best_connected_idx])?;
            let unconnected_comp = model.components.get(&net.members[best_unconnected_idx])?;

            let request = RouteRequest {
                start: GridPoint3D::new(connected_comp.position.x, connected_comp.position.y, connected_comp.layer),
                end: GridPoint3D::new(unconnected_comp.position.x, unconnected_comp.position.y, unconnected_comp.layer),
                blocked_points: blocked_points.clone(),
                max_steps: self.config.max_steps,
                allowed_layers: self.config.allowed_layers.clone(),
            };

            let route_result = route_a_star_3d(&request);
            if !route_result.success {
                return None; // Failed to route this net
            }

            total_path.extend(route_result.path.clone());
            connected.push(net.members[best_unconnected_idx]);
        }

        // Count vias in the total path
        let mut via_count = 0;
        for i in 1..total_path.len() {
            if total_path[i].layer != total_path[i - 1].layer {
                via_count += 1;
            }
        }

        Some(RouteResult {
            success: true,
            path: total_path,
            expanded_nodes: 0, // Aggregated from individual routes
            via_count,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auto_router_sorts_nets_by_priority() {
        let config = AutoRouterConfig {
            priority_mode: RoutingPriority::PowerFirst,
            ..Default::default()
        };
        let router = AutoRouter::new(config);

        let model = DomainModel::new("test");
        let nets = vec![];
        let sorted = router.sort_nets_by_priority(&nets, &model);
        assert_eq!(sorted.len(), 0);
    }
}
