use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NonlinearModel {
    Diode { is: f64, vt: f64, n: f64 },
    BJT { is: f64, bf: f64, br: f64, vaf: f64 },
    MOSFET { kp: f64, vto: f64, lambda: f64 },
}

impl NonlinearModel {
    pub fn diode_default() -> Self {
        Self::Diode { is: 1e-14, vt: 0.02585, n: 1.0 }
    }

    /// Calculate current and conductance for Newton-Raphson iteration
    pub fn evaluate(&self, v: f64) -> (f64, f64) {
        match self {
            Self::Diode { is, vt, n } => {
                let v_eff = v / (n * vt);
                let i = is * (v_eff.exp() - 1.0);
                let g = (is / (n * vt)) * v_eff.exp();
                (i, g)
            }
            Self::BJT { .. } => {
                // Simplified BJT model
                (0.0, 0.0)
            }
            Self::MOSFET { kp, vto, lambda } => {
                if v < *vto {
                    (0.0, 0.0)
                } else {
                    let v_ov = v - vto;
                    let i = 0.5 * kp * v_ov.powi(2) * (1.0 + lambda * v);
                    let g = kp * v_ov * (1.0 + lambda * v);
                    (i, g)
                }
            }
        }
    }
}

pub struct NewtonRaphsonSolver {
    pub max_iter: usize,
    pub tol: f64,
}

impl NewtonRaphsonSolver {
    pub fn new() -> Self {
        Self { max_iter: 100, tol: 1e-6 }
    }

    pub fn solve<F>(&self, initial_v: f64, mut f: F) -> Result<f64, String>
    where
        F: FnMut(f64) -> (f64, f64),
    {
        let mut v = initial_v;
        for _ in 0..self.max_iter {
            let (i, g) = f(v);
            if g.abs() < 1e-15 {
                return Err("Singular matrix in Newton-Raphson".to_string());
            }
            let delta_v = -i / g;
            v += delta_v;
            if delta_v.abs() < self.tol {
                return Ok(v);
            }
        }
        Err("Newton-Raphson failed to converge".to_string())
    }
}
