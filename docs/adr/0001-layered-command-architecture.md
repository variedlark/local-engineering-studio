# ADR 0001: Layered command architecture

## Status

Accepted

## Context

The application targets long-term maintainability with heavy computation and rich desktop UX. The codebase needs stable boundaries as it scales.

## Decision

- Use a layered architecture:
  - foundation primitives
  - domain model and command invariants
  - engine crates
  - app orchestration/services
  - adapter crates (storage/import-export/ipc)
- Use a command-driven mutation model where Rust owns canonical project state.
- Keep frontend state as projection/interaction state, never as authoritative source of truth.

## Consequences

- Deterministic undo/redo and replay become feasible.
- IPC contracts remain stable and explicit.
- Refactoring across boundaries must go through ADR and contract updates.
