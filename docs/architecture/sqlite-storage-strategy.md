# SQLite storage strategy

The SQLite adapter persists complete project snapshots as JSON for lossless round-tripping with the bundle format. Relational columns are reserved for metadata/indexes used by project lists, search, and future migrations.

Current strategy:

- Store the canonical snapshot JSON as the source of truth.
- Keep metadata indexes small and derived from the snapshot.
- Add migrations before changing the JSON envelope or promoting fields into indexed columns.
- Preserve backwards reads by treating missing metadata as `Unspecified` or by deriving it from JSON.
