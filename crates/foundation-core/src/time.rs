use std::time::{SystemTime, UNIX_EPOCH};

/// Returns milliseconds since UNIX epoch.
#[must_use]
pub fn unix_millis_now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map_or(0, |duration| duration.as_millis() as u64)
}
