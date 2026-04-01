use serde::{Deserialize, Serialize};

/// Stable error classification for cross-layer handling.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CoreErrorCode {
    InvalidArgument,
    NotFound,
    Conflict,
    Validation,
    Storage,
    Internal,
}

/// Common error type shared by foundational APIs.
#[derive(Debug, Clone, thiserror::Error, Serialize, Deserialize)]
#[error("[{code:?}] {message}")]
pub struct CoreError {
    pub code: CoreErrorCode,
    pub message: String,
}

impl CoreError {
    #[must_use]
    pub fn new(code: CoreErrorCode, message: impl Into<String>) -> Self {
        Self { code, message: message.into() }
    }
}
