# Project Format v1 (Draft)

## Bundle layout

Each project lives in a directory bundle:

- `manifest.json`
- `model.sqlite`
- `assets/`
- `autosave/`
- `backups/`
- `cache/` (optional, non-authoritative)

## Manifest fields

- `project_id` (UUIDv7)
- `name`
- `format_major`
- `format_minor`
- `created_at_ms`
- `updated_at_ms`

## Compatibility policy

- Read all versions in the current major.
- Migrate older minor versions forward on open.
- Always create a backup before migration.

## Model notes

- Components include an integer `layer` (default `0`).
- Rules include `min_spacing_um` and `grid_step_um`.
- Validation requires `min_spacing_um > 0`, `grid_step_um > 0`, and `min_spacing_um % grid_step_um == 0`.

## Autosave and recovery

- Autosave writes `autosave/journal.json` with a full session snapshot.
- Autosave writes `autosave/command-log.json` with replayable command entries.
- Recovery path prefers autosave journal when it matches project id.
- Manual save writes `manifest.json` and `snapshot.json` atomically by file replacement strategy.

## Corruption handling baseline

- Validate manifest id against snapshot id before opening.
- Use SQLite `PRAGMA integrity_check` for DB-backed projections.
- Keep recovery runbook under `docs/runbooks/recovery-runbook.md`.
