use crate::{GridPoint3D, RouteRequest, RouteResult, route_a_star_3d};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffPairRequest {
    pub p_start: GridPoint3D,
    pub p_end: GridPoint3D,
    pub n_start: GridPoint3D,
    pub n_end: GridPoint3D,
    pub blocked_points: HashSet<GridPoint3D>,
    pub max_steps: usize,
    pub allowed_layers: Vec<i32>,
    pub target_spacing: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffPairResult {
    pub success: bool,
    pub p_path: Vec<GridPoint3D>,
    pub n_path: Vec<GridPoint3D>,
    pub skew_ps: f64, // Skew in picoseconds (estimated)
}

pub fn route_diff_pair(request: &DiffPairRequest) -> DiffPairResult {
    // Phase 1: Route P trace
    let p_request = RouteRequest {
        start: request.p_start,
        end: request.p_end,
        blocked_points: request.blocked_points.clone(),
        max_steps: request.max_steps,
        allowed_layers: request.allowed_layers.clone(),
    };
    let p_result = route_a_star_3d(&p_request);

    if !p_result.success {
        return DiffPairResult {
            success: false,
            p_path: Vec::new(),
            n_path: Vec::new(),
            skew_ps: 0.0,
        };
    }

    // Phase 2: Route N trace parallel to P
    let mut n_blocked = request.blocked_points.clone();
    for p in &p_result.path {
        n_blocked.insert(*p);
    }

    let n_request = RouteRequest {
        start: request.n_start,
        end: request.n_end,
        blocked_points: n_blocked,
        max_steps: request.max_steps,
        allowed_layers: request.allowed_layers.clone(),
    };
    let n_result = route_a_star_3d(&n_request);

    if !n_result.success {
        return DiffPairResult {
            success: false,
            p_path: p_result.path,
            n_path: Vec::new(),
            skew_ps: 0.0,
        };
    }

    // Calculate skew (simplified: difference in length)
    let p_len = p_result.path.len() as f64;
    let n_len = n_result.path.len() as f64;
    let skew = (p_len - n_len).abs() * 6.0; // 6ps per grid unit (estimated)

    DiffPairResult {
        success: true,
        p_path: p_result.path,
        n_path: n_result.path,
        skew_ps: skew,
    }
}

use serde::{Deserialize, Serialize};
