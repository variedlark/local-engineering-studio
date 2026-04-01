# Maintainability Roadmap

This document defines the long-term quality and maintainability roadmap for Local Engineering Studio.

## Principles

- Prefer real product capability over synthetic code growth.
- Keep runtime paths free of generated bloat.
- Make architecture boundaries explicit and enforceable.
- Grow confidence through deterministic tests and reproducible quality gates.

## Baseline policy (enforced now)

1. Generated runtime bloat is forbidden in:
   - `apps/desktop-ui/src/features/ui-plus/`
   - `apps/desktop-ui/src/features/pcp/catalog/`
   - `crates/engine-industrial/`
2. CI blocks merges that reintroduce these paths.
3. New large datasets must live in fixture or benchmark storage with explicit loading boundaries.
4. Feature-layer modules may not import app-layer modules directly.

## Improvement tracks

### 1) Architecture boundaries

- Split large feature orchestrators into focused modules.
- Keep state stores orchestration-centric and domain logic in pure helpers.
- Enforce layering rules (UI -> feature orchestration -> domain helpers -> adapters).

### 2) Data and code generation strategy

- Move large generated datasets to fixtures or external persisted data.
- Add typed ingestion/query APIs instead of giant source files.
- Keep generated artifacts out of hot runtime paths and review diffs.

### 3) Testing strategy

- Expand unit tests for pure helpers.
- Add integration tests for full PCB lifecycle flows.
- Add export golden tests and deterministic replay tests.

### 4) Quality gates

- Keep strict frontend and Rust gates green.
- Add generated-bloat guard (implemented).
- Add duplication detection for runtime source.
- Add critical-runtime guard against unchecked `unwrap`/`expect` (implemented).
- Add per-file hot-path size budgets for large orchestrators (implemented for `ui-store.ts`).

### 5) Observability and diagnostics

- Standardize status/event/log shaping.
- Add consistent error categories and user-facing status semantics.

### 6) Documentation quality

- Keep roadmap and architecture docs aligned with actual code.
- Record key decisions and constraints as short ADRs.

## Execution order

1. Remove generated bloat and enforce guardrails.
2. Refactor large orchestrator modules incrementally with tests.
3. Strengthen integration/e2e coverage for critical workflows.
4. Implement deeper PCB features with measurable quality budgets.
