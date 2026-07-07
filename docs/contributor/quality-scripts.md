# Quality scripts

All scripts are blocking in CI unless the workflow marks them otherwise.

- `pnpm check:generated` (`scripts/check_generated_bloat.py`): rejects generated or build artefacts that are too large or should not be versioned. Remove generated files or add a documented exception.
- `pnpm check:boundaries` (`scripts/check_architecture_boundaries.py`): verifies monorepo architecture boundaries. Move code to the correct package/crate or add an explicit boundary rule.
- `pnpm check:duplicates` (`scripts/check_structural_duplicates.py`): flags large duplicated structures. Extract shared helpers or document intentional duplication.
- `pnpm check:file-size` (`scripts/check_file_size_limits.py`): enforces maintainable file-size thresholds. Split oversized modules by domain responsibility.
- `pnpm check:critical` (`scripts/check_no_critical_unwrap.py`): blocks risky `unwrap`/`expect` usage in critical Rust paths. Propagate typed errors or add a narrowly-scoped justification.

Use pnpm for Node tasks; npm lockfiles are intentionally ignored.
