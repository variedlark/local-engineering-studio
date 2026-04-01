# Local Engineering Studio

Local-only desktop engineering/design application scaffold with a Rust computational core and Tauri + React frontend shell.

## Why this project exists

Local Engineering Studio is designed for deterministic, offline-first engineering workflows where command history, reproducibility, and strict local control matter more than cloud dependencies.

## Production readiness highlights

- local-first architecture (no mandatory network dependency)
- deterministic command model with undo/redo and batch operations
- project persistence + autosave + import/export boundaries
- cross-language type contracts (`packages/ipc-contract-ts` + Rust IPC contracts)
- CI quality gates for frontend and Rust
- contributor and community health files for open-source adoption

Current implementation includes:

- command-driven domain model with deterministic undo/redo, layer control, rules editing, and batch commands
- local project bundle persistence with manifest + snapshot + autosave journal
- SQLite repository with schema migration and integrity check hooks
- Tauri command API for create/open/save/autosave/execute/undo/redo/snapshot + analysis
- frontend command palette + keyboard shortcuts + autosave timer + live analysis panels
- frontend command palette (search), project component list, editable inspector, route/rules/sim controls
- routing, DRC, and simulation engine modules wired to app services
- import/export adapter crate with JSON and SVG export support

Recent UX additions:

- Select components from sidebar and inspector dropdown.
- Rename project name directly from the sidebar metadata panel.
- Rename/move/delete components and assign layers from inspector.
- Duplicate selected components with toolbar, inspector, or command palette.
- Route between explicit `from` and `to` components with path preview.
- Configure DRC rules (`min_spacing_um`, `grid_step_um`) from the analysis panel.
- Configure simulation parameters (`time_step`, `steps`, `initial_energy`) from the analysis panel.
- Clear activity log and use extra shortcuts: `Cmd/Ctrl+A` autosave, `Cmd/Ctrl+D` duplicate, `F6` route, `F7` simulation.
- Run a quality suite (`F8`) that combines DRC + route + simulation into a product quality score.
- Place component templates (line/ring/grid) for faster layout prototyping.
- Workspace preferences (autosave interval, step, accent, density, hints) persisted in local storage.
- Interactive canvas with draggable components, pan/zoom controls, and snap/grid toggles.
- Event history panel with searchable/filterable command-analysis-system timeline.
- Command Deck dashboard with live KPIs and activity pulse.
- Quick Actions panel for high-frequency operations.
- Session Notes panel with pinned note workflows.
- Viewport Snapshots panel for reusable camera/grid states.
- Recommendations panel with context-aware quality/workflow guidance.

## Goals

- Keep all core functionality offline and local.
- Enforce strong architectural boundaries for a large codebase.
- Build deterministic command processing with robust persistence hooks.

## Monorepo Layout

- `apps/desktop-ui`: React + TypeScript + Vite UI shell.
- `apps/desktop-shell`: Tauri 2 desktop wrapper.
- `crates/*`: Rust workspace for domain, engines, storage, and contracts.
- `packages/*`: Shared TypeScript packages.
- `docs/*`: Architecture and process documentation.

## Quick Start

1. Install Rust stable and Node 22+ with pnpm.
2. Install dependencies:

```bash
pnpm install
cargo check
```

3. Run frontend UI shell:

```bash
pnpm --filter desktop-ui dev
```

4. Run Tauri shell (after frontend dependencies are installed):

```bash
pnpm --filter desktop-shell tauri:dev
```

5. If you only want to run the backend checks:

```bash
cargo test
```

## Release and GitHub readiness

Repository now includes:

- `LICENSE` (MIT)
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- issue templates and PR template under `.github/`
- CI workflows for frontend, Rust, and combined quality gate

## Using The App

- Follow the complete step-by-step workflow in `docs/how-to-use.md`.
- Phase Two delivery details are documented in `docs/phase-two-mega-pass.md`.
- Imperial expansion details are documented in `docs/imperial-expansion.md`.
- PCP foundation modules added in this pass are documented in `docs/pcp-mega-foundation.md`.
- Maintainability priorities and quality roadmap are documented in `docs/maintainability-roadmap.md`.

## Quality Commands

- `cargo fmt --all`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `cargo test`
- `pnpm --filter desktop-ui check`
- `pnpm --filter desktop-ui test`
- `pnpm --filter desktop-ui build`
- `pnpm run check:generated`
- `pnpm run check:boundaries`
- `pnpm run check:duplicates`
- `pnpm run check:file-size`
- `pnpm run check:critical`
