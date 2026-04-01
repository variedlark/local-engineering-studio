//! Typed DTOs for frontend <-> backend IPC.

pub mod dto;

pub use dto::{
    AnalysisRequestDto, CommandRequestDto, CommandResponseDto, CreateProjectRequestDto,
    CreateProjectResponseDto, DrcResponseDto, ExportProjectRequestDto, ImportExportStatsDto,
    ImportProjectRequestDto, ListOpenProjectsResponseDto, OpenProjectRequestDto,
    PersistProjectRequestDto, ProjectPathResponseDto, ProjectSnapshotDto, RouteRequestDto,
    RouteResponseDto, SimulationRequestDto, SimulationResponseDto, UndoRedoRequestDto,
    UndoRedoResponseDto,
};
