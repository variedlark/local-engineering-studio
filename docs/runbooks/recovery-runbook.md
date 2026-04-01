# Recovery Runbook

## Symptoms

- Project fails to open after crash.
- Snapshot checksum mismatch.
- Migration interrupted.

## Recovery sequence

1. Open project in safe mode (no write).
2. Validate SQLite integrity and manifest schema.
3. If integrity fails, restore latest backup from `backups/`.
4. Reapply autosave journal from `autosave/` if available.
5. If reapply fails, salvage valid entities into a new project bundle.

## Safety rules

- Never overwrite the original project bundle automatically.
- Keep all failed recovery artifacts for manual inspection.
