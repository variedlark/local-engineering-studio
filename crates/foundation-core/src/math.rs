use serde::{Deserialize, Serialize};

/// Integer world coordinate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Point2i {
    pub x: i64,
    pub y: i64,
}

impl Point2i {
    #[must_use]
    pub fn new(x: i64, y: i64) -> Self {
        Self { x, y }
    }
}

/// Integer vector in world units.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Vector2i {
    pub dx: i64,
    pub dy: i64,
}

impl Vector2i {
    #[must_use]
    pub fn new(dx: i64, dy: i64) -> Self {
        Self { dx, dy }
    }
}

/// Axis-aligned bounding box in integer coordinates.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Aabb2i {
    pub min: Point2i,
    pub max: Point2i,
}

impl Aabb2i {
    #[must_use]
    pub fn new(min: Point2i, max: Point2i) -> Self {
        Self { min, max }
    }

    #[must_use]
    pub fn width(self) -> i64 {
        self.max.x - self.min.x
    }

    #[must_use]
    pub fn height(self) -> i64 {
        self.max.y - self.min.y
    }

    #[must_use]
    pub fn contains(self, point: Point2i) -> bool {
        point.x >= self.min.x
            && point.x <= self.max.x
            && point.y >= self.min.y
            && point.y <= self.max.y
    }

    #[must_use]
    pub fn translate(self, offset: Vector2i) -> Self {
        Self {
            min: Point2i::new(self.min.x + offset.dx, self.min.y + offset.dy),
            max: Point2i::new(self.max.x + offset.dx, self.max.y + offset.dy),
        }
    }

    #[must_use]
    pub fn union(self, other: Self) -> Self {
        Self {
            min: Point2i::new(self.min.x.min(other.min.x), self.min.y.min(other.min.y)),
            max: Point2i::new(self.max.x.max(other.max.x), self.max.y.max(other.max.y)),
        }
    }
}
