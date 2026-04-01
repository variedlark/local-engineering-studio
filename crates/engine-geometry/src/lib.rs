//! Geometry engine primitives and broad-phase helpers.

use foundation_core::{Aabb2i, Point2i};

/// Returns `true` when two axis-aligned bounds overlap.
#[must_use]
pub fn aabb_overlap(lhs: Aabb2i, rhs: Aabb2i) -> bool {
    lhs.min.x <= rhs.max.x
        && lhs.max.x >= rhs.min.x
        && lhs.min.y <= rhs.max.y
        && lhs.max.y >= rhs.min.y
}

/// Computes the Manhattan distance between two points.
#[must_use]
pub fn manhattan_distance(a: Point2i, b: Point2i) -> i64 {
    (a.x - b.x).abs() + (a.y - b.y).abs()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn overlap_detects_intersection() {
        let a = Aabb2i::new(Point2i::new(0, 0), Point2i::new(10, 10));
        let b = Aabb2i::new(Point2i::new(5, 5), Point2i::new(12, 15));
        assert!(aabb_overlap(a, b));
    }

    #[test]
    fn manhattan_distance_is_positive() {
        let a = Point2i::new(-10, 4);
        let b = Point2i::new(9, -8);
        assert_eq!(manhattan_distance(a, b), 31);
    }
}
