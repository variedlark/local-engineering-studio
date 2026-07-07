use std::collections::HashMap;

/// A simple Sparse Matrix representation using Compressed Sparse Row (CSR) format
#[derive(Debug, Clone)]
pub struct SparseMatrix {
    pub rows: usize,
    pub cols: usize,
    pub values: Vec<f64>,
    pub col_indices: Vec<usize>,
    pub row_ptr: Vec<usize>,
}

impl SparseMatrix {
    pub fn new(rows: usize, cols: usize) -> Self {
        Self { rows, cols, values: Vec::new(), col_indices: Vec::new(), row_ptr: vec![0; rows + 1] }
    }

    /// Build CSR matrix from a coordinate format (triplet)
    pub fn from_triplets(rows: usize, cols: usize, triplets: &[(usize, usize, f64)]) -> Self {
        let mut matrix = HashMap::new();
        for &(r, c, v) in triplets {
            *matrix.entry((r, c)).or_insert(0.0) += v;
        }

        let mut sorted_triplets: Vec<_> = matrix.into_iter().collect();
        sorted_triplets.sort_by_key(|&((r, c), _)| (r, c));

        let mut values = Vec::new();
        let mut col_indices = Vec::new();
        let mut row_ptr = vec![0; rows + 1];
        let mut current_row = 0;

        for ((r, c), v) in sorted_triplets {
            while current_row < r {
                current_row += 1;
                row_ptr[current_row] = values.len();
            }
            values.push(v);
            col_indices.push(c);
        }

        while current_row < rows {
            current_row += 1;
            row_ptr[current_row] = values.len();
        }

        Self { rows, cols, values, col_indices, row_ptr }
    }

    /// Solve Ax = b using Jacobi iterative method (simplified for sparse)
    pub fn solve_jacobi(&self, b: &[f64], max_iter: usize, tol: f64) -> Vec<f64> {
        let mut x = vec![0.0; self.rows];
        let mut x_new = vec![0.0; self.rows];

        for _ in 0..max_iter {
            for i in 0..self.rows {
                let mut sigma = 0.0;
                let mut diag = 0.0;

                for idx in self.row_ptr[i]..self.row_ptr[i + 1] {
                    let j = self.col_indices[idx];
                    if i == j {
                        diag = self.values[idx];
                    } else {
                        sigma += self.values[idx] * x[j];
                    }
                }

                if diag.abs() > 1e-15 {
                    x_new[i] = (b[i] - sigma) / diag;
                }
            }

            // Check convergence
            let mut diff = 0.0;
            for i in 0..self.rows {
                diff += (x_new[i] - x[i]).powi(2);
            }

            x.copy_from_slice(&x_new);

            if diff.sqrt() < tol {
                break;
            }
        }

        x
    }
}
