use domain_core::DomainModel;
use domain_core::validation::DomainValidationError;
use engine_drc::{DrcReport, run_drc};
use engine_routing::{RouteResult, route_between_components};
use engine_simulation::{SimulationConfig, SimulationReport, run_simulation};
use foundation_core::ComponentId;

#[derive(Debug, thiserror::Error)]
pub enum AnalysisError {
    #[error("component not found")]
    ComponentNotFound,
    #[error("domain validation failed: {0}")]
    DomainValidation(#[from] DomainValidationError),
}

pub fn analyze_drc(model: &DomainModel) -> DrcReport {
    run_drc(model)
}

pub fn analyze_simulation(model: &DomainModel, config: SimulationConfig) -> SimulationReport {
    run_simulation(model, config)
}

pub fn analyze_route(
    model: &DomainModel,
    from: ComponentId,
    to: ComponentId,
) -> Result<RouteResult, AnalysisError> {
    route_between_components(model, from, to).ok_or(AnalysisError::ComponentNotFound)
}
