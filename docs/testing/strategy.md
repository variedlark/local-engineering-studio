# Testing Strategy

## Rust

- Unit tests in foundational and domain crates.
- Integration tests for app orchestration and storage adapters.
- Determinism tests for command replay and undo/redo.
- Bundle recovery tests with autosave journal and command log replay.
- DRC/routing/simulation engine tests with deterministic fixtures.

## Frontend

- Vitest component tests for layout and interactions.
- Playwright e2e tests added after first Tauri vertical slice.
- IPC client schema validation checks for analysis commands.
- Command palette search and inspector/rules control rendering checks.
- Duplicate/project-rename flow coverage in component tests and backend command tests.

## Performance

- Macro benchmarks with representative fixtures.
- Budgets enforced in CI for startup and core operations.
- Add routing/DRC/simulation throughput checks against benchmark scenarios.
