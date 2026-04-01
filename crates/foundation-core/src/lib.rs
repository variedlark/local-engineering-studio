//! Foundation primitives shared across domain and engine crates.

pub mod error;
pub mod id;
pub mod math;
pub mod time;

pub use error::{CoreError, CoreErrorCode};
pub use id::{CommandId, ComponentId, NetId, ProjectId};
pub use math::{Aabb2i, Point2i, Vector2i};
pub use time::unix_millis_now;
