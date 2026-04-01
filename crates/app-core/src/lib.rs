//! Application orchestration layer with history and projections.

pub mod analysis;
pub mod bundle;
pub mod history;
pub mod project;
pub mod service;

pub use analysis::{AnalysisError, analyze_drc, analyze_route, analyze_simulation};
pub use bundle::{BundleError, ProjectBundleStore};
pub use history::CommandHistory;
pub use project::ProjectSession;
pub use service::{AppError, AppService};
