# Contributing

## Boundary rules

- Domain and engine crates must not depend on UI or Tauri APIs.
- Frontend never reads/writes project files directly.
- All state mutations go through command APIs.
- Analysis endpoints (DRC/routing/simulation) must operate on immutable snapshots.
- Import/export adapters should remain pure boundary modules under `adapters-*` crates.

## Required checks

- `cargo fmt --all`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `cargo test`
- `pnpm --filter desktop-ui check`
- `pnpm --filter desktop-ui test`
- `pnpm --filter desktop-ui lint`
- `pnpm --filter desktop-ui build`
- `pnpm run check:generated`
- `pnpm run check:boundaries`
- `pnpm run check:duplicates`
- `pnpm run check:file-size`
- `pnpm run check:critical`

## Repository standards

- Keep changes local-first; avoid introducing mandatory cloud dependencies.
- Maintain strict command-driven mutation paths for project state.
- Update `docs/how-to-use.md` and `README.md` when adding visible UX flows.
- For GitHub-facing changes, keep issue templates, PR template, and policy docs current.
- Keep runtime Rust code free of direct `unwrap`/`expect`; prefer typed error handling.
