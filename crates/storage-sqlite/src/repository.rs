use domain_core::DomainModel;
use foundation_core::ProjectId;
use rusqlite::{Connection, params};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MigrationRecord {
    pub version: i64,
    pub applied_at_ms: i64,
}

#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

pub struct ProjectRepository {
    connection: Connection,
}

impl ProjectRepository {
    pub fn open(path: &str) -> Result<Self, RepositoryError> {
        let connection = Connection::open(path)?;
        let repository = Self { connection };
        repository.migrate()?;
        Ok(repository)
    }

    pub fn open_in_memory() -> Result<Self, RepositoryError> {
        let connection = Connection::open_in_memory()?;
        let repository = Self { connection };
        repository.migrate()?;
        Ok(repository)
    }

    pub fn migrate(&self) -> Result<(), RepositoryError> {
        self.connection.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS schema_migrations (
              version INTEGER PRIMARY KEY,
              applied_at_ms INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS projects (
              project_id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              format_major INTEGER NOT NULL,
              format_minor INTEGER NOT NULL,
              revision INTEGER NOT NULL,
              snapshot_json TEXT NOT NULL,
              updated_at_ms INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_projects_updated_at_ms ON projects(updated_at_ms DESC);
            ",
        )?;

        let count: i64 =
            self.connection
                .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| row.get(0))?;
        if count == 0 {
            let _rows = self.connection.execute(
                "INSERT INTO schema_migrations(version, applied_at_ms) VALUES (1, CAST(strftime('%s','now') AS INTEGER) * 1000)",
                [],
            )?;
        }
        Ok(())
    }

    pub fn save_snapshot(
        &self,
        model: &DomainModel,
        updated_at_ms: u64,
    ) -> Result<(), RepositoryError> {
        let snapshot_json = serde_json::to_string(model)?;
        let _rows = self.connection.execute(
            "
            INSERT INTO projects (project_id, name, format_major, format_minor, revision, snapshot_json, updated_at_ms)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ON CONFLICT(project_id) DO UPDATE SET
              name = excluded.name,
              format_major = excluded.format_major,
              format_minor = excluded.format_minor,
              revision = excluded.revision,
              snapshot_json = excluded.snapshot_json,
              updated_at_ms = excluded.updated_at_ms
            ",
            params![
                model.meta.project_id.to_string(),
                &model.meta.name,
                model.meta.format_major,
                model.meta.format_minor,
                model.meta.revision,
                snapshot_json,
                updated_at_ms,
            ],
        )?;
        Ok(())
    }

    pub fn load_snapshot(
        &self,
        project_id: ProjectId,
    ) -> Result<Option<DomainModel>, RepositoryError> {
        let mut statement = self
            .connection
            .prepare("SELECT snapshot_json FROM projects WHERE project_id = ?1 LIMIT 1")?;

        let mut rows = statement.query(params![project_id.to_string()])?;
        let Some(row) = rows.next()? else {
            return Ok(None);
        };

        let snapshot_json: String = row.get(0)?;
        let model = serde_json::from_str::<DomainModel>(&snapshot_json)?;
        Ok(Some(model))
    }

    pub fn list_migrations(&self) -> Result<Vec<MigrationRecord>, RepositoryError> {
        let mut statement = self
            .connection
            .prepare("SELECT version, applied_at_ms FROM schema_migrations ORDER BY version ASC")?;
        let rows = statement.query_map([], |row| {
            Ok(MigrationRecord { version: row.get(0)?, applied_at_ms: row.get(1)? })
        })?;
        rows.collect::<Result<Vec<_>, _>>().map_err(RepositoryError::Database)
    }

    pub fn integrity_check(&self) -> Result<(), RepositoryError> {
        let mut statement = self.connection.prepare("PRAGMA integrity_check")?;
        let mut rows = statement.query([])?;
        while let Some(row) = rows.next()? {
            let result: String = row.get(0)?;
            if result != "ok" {
                return Err(RepositoryError::Database(rusqlite::Error::InvalidQuery));
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use domain_core::DomainModel;

    #[test]
    fn save_and_load_round_trip() {
        let repository = ProjectRepository::open_in_memory().expect("open repository");
        let model = DomainModel::new("test-project");
        repository.save_snapshot(&model, 12345).expect("save snapshot");

        let loaded = repository
            .load_snapshot(model.meta.project_id)
            .expect("load snapshot")
            .expect("snapshot present");

        assert_eq!(loaded.meta.project_id, model.meta.project_id);
        assert_eq!(loaded.meta.name, "test-project");
    }

    #[test]
    fn migration_and_integrity_checks_are_available() {
        let repository = ProjectRepository::open_in_memory().expect("open repository");
        let migrations = repository.list_migrations().expect("list migrations");
        assert_eq!(migrations[0].version, 1);
        repository.integrity_check().expect("integrity check");
    }
}
