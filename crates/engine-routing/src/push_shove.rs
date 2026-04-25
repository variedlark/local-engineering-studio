use crate::{GridPoint3D, RouteRequest, RouteResult, route_a_star_3d};
use std::collections::{HashMap, HashSet};
use foundation_core::Point2i;

pub struct PushShoveEngine {
    pub grid_size: i64,
}

impl PushShoveEngine {
    pub fn new(grid_size: i64) -> Self {
        Self { grid_size }
    }

    /// Tries to route a path by pushing existing traces out of the way
    pub fn route_with_push(
        &self,
        request: &RouteRequest,
        existing_traces: &HashMap<String, Vec<GridPoint3D>>,
    ) -> (RouteResult, HashMap<String, Vec<GridPoint3D>>) {
        // 1. Try normal routing first
        let initial_result = route_a_star_3d(request);
        if initial_result.success {
            return (initial_result, existing_traces.clone());
        }

        // 2. If failed, identify blocking traces
        let mut modified_traces = existing_traces.clone();
        let mut current_blocked = request.blocked_points.clone();
        
        // Simplified Push: temporarily ignore some blocked points and see if we can route
        // In a real implementation, this would involve complex geometric shifting
        let mut relaxed_request = request.clone();
        relaxed_request.max_steps *= 2;
        
        // Identify which trace is most likely blocking
        for (id, path) in existing_traces {
            let mut test_blocked = request.blocked_points.clone();
            for p in path {
                test_blocked.remove(p);
            }
            
            let test_request = RouteRequest {
                blocked_points: test_blocked,
                ..relaxed_request.clone()
            };
            
            let test_res = route_a_star_3d(&test_request);
            if test_res.success {
                // We found the blocking trace! Try to "shove" it
                if let Some(shoved_path) = self.shove_trace(path, &test_res.path) {
                    modified_traces.insert(id.clone(), shoved_path);
                    return (test_res, modified_traces);
                }
            }
        }

        (initial_result, existing_traces.clone())
    }

    fn shove_trace(&self, original: &[GridPoint3D], intruder: &[GridPoint3D]) -> Option<Vec<GridPoint3D>> {
        let intruder_set: HashSet<GridPoint3D> = intruder.iter().copied().collect();
        let mut shoved = Vec::new();

        for p in original {
            if intruder_set.contains(p) {
                // Try to move point p to a neighbor that is not in intruder_set
                let mut moved = false;
                for dx in [-1, 1] {
                    for dy in [-1, 1] {
                        let np = GridPoint3D::new(p.x + dx, p.y + dy, p.layer);
                        if !intruder_set.contains(&np) {
                            shoved.push(np);
                            moved = true;
                            break;
                        }
                    }
                    if moved { break; }
                }
                if !moved { return None; } // Could not shove
            } else {
                shoved.push(*p);
            }
        }
        Some(shoved)
    }
}
