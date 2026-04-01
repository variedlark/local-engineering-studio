//! Local SQLite storage adapter for project persistence.

pub mod repository;

pub use repository::{ProjectRepository, RepositoryError};
