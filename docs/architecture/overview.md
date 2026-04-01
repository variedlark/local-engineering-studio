# Architecture Overview

## Core principles

- Local-first and offline-capable by default.
- Rust authoritative state for deterministic behavior.
- Strict dependency direction from low-level primitives to high-level adapters.
- UI receives projections and dispatches typed commands.

## Runtime flow

1. Frontend triggers typed IPC command.
2. Tauri bridge maps request into `app-core` service call.
3. `app-core` validates and executes `domain-core` command.
4. Optional engine computations update projections.
5. Storage adapter persists snapshots/journal.
6. Frontend refreshes views from snapshots/projections.

## Current command API

- `create_project`
- `open_project`
- `save_project`
- `autosave_project`
- `execute_command`
- `undo`
- `redo`
- `project_snapshot`
- `list_open_projects`
- `run_drc`
- `run_route`
- `run_simulation`

## Domain command surface

- `place_component`
- `move_component`
- `rename_component`
- `rename_project`
- `set_component_layer`
- `set_rules`
- `delete_component`
- `batch`

## Engine modules

- `engine-geometry`: geometric primitives and broad-phase utilities.
- `engine-graph`: connectivity and traversal logic.
- `engine-routing`: grid/manhattan routing prototype.
- `engine-drc`: spacing and rule-check evaluation.
- `engine-simulation`: deterministic transient simulation scaffold.
