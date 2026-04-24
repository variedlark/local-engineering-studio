use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudProject {
    pub project_id: String,
    pub name: String,
    pub owner_id: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub version: u32,
    pub collaborators: Vec<Collaborator>,
    pub is_public: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collaborator {
    pub user_id: String,
    pub email: String,
    pub role: CollaboratorRole,
    pub joined_at: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CollaboratorRole {
    Owner,
    Editor,
    Viewer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudChange {
    pub change_id: String,
    pub project_id: String,
    pub user_id: String,
    pub timestamp: u64,
    pub change_type: ChangeType,
    pub description: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChangeType {
    ComponentAdded,
    ComponentMoved,
    ComponentDeleted,
    TraceAdded,
    TraceDeleted,
    SimulationRun,
    DesignExported,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudBackup {
    pub backup_id: String,
    pub project_id: String,
    pub timestamp: u64,
    pub size_bytes: u64,
    pub checksum: String,
    pub version: u32,
}

pub struct CloudAdapter;

impl CloudAdapter {
    /// Create a new cloud project
    pub fn create_project(name: String, owner_id: String) -> CloudProject {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        CloudProject {
            project_id: uuid::Uuid::new_v4().to_string(),
            name,
            owner_id,
            created_at: now,
            updated_at: now,
            version: 1,
            collaborators: Vec::new(),
            is_public: false,
        }
    }

    /// Add a collaborator to a project
    pub fn add_collaborator(
        project: &mut CloudProject,
        user_id: String,
        email: String,
        role: CollaboratorRole,
    ) -> Result<(), String> {
        if project.collaborators.iter().any(|c| c.user_id == user_id) {
            return Err("User already a collaborator".to_string());
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        project.collaborators.push(Collaborator {
            user_id,
            email,
            role,
            joined_at: now,
        });

        Ok(())
    }

    /// Record a change to the project
    pub fn record_change(
        project_id: String,
        user_id: String,
        change_type: ChangeType,
        description: String,
    ) -> CloudChange {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        CloudChange {
            change_id: uuid::Uuid::new_v4().to_string(),
            project_id,
            user_id,
            timestamp: now,
            change_type,
            description,
        }
    }

    /// Create a backup of the project
    pub fn create_backup(project_id: String, version: u32, data: &[u8]) -> CloudBackup {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        let checksum = format!("{:x}", hasher.finish());

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        CloudBackup {
            backup_id: uuid::Uuid::new_v4().to_string(),
            project_id,
            timestamp: now,
            size_bytes: data.len() as u64,
            checksum,
            version,
        }
    }

    /// Verify backup integrity
    pub fn verify_backup(backup: &CloudBackup, data: &[u8]) -> bool {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        let checksum = format!("{:x}", hasher.finish());

        backup.checksum == checksum && backup.size_bytes == data.len() as u64
    }

    /// Calculate storage usage
    pub fn calculate_storage_usage(backups: &[CloudBackup]) -> u64 {
        backups.iter().map(|b| b.size_bytes).sum()
    }

    /// Get activity log for a project
    pub fn get_activity_log(changes: &[CloudChange], limit: usize) -> Vec<CloudChange> {
        let mut sorted = changes.to_vec();
        sorted.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        sorted.into_iter().take(limit).collect()
    }
}

// Placeholder for uuid crate (would be added as dependency)
mod uuid {
    use std::fmt;

    #[derive(Clone)]
    pub struct Uuid([u8; 16]);

    impl Uuid {
        pub fn new_v4() -> Self {
            // Simplified UUID v4 generation
            let mut bytes = [0u8; 16];
            for i in 0..16 {
                bytes[i] = (std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos() as u8)
                    .wrapping_add(i as u8);
            }
            Uuid(bytes)
        }
    }

    impl fmt::Display for Uuid {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(
                f,
                "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
                self.0[0], self.0[1], self.0[2], self.0[3],
                self.0[4], self.0[5],
                self.0[6], self.0[7],
                self.0[8], self.0[9],
                self.0[10], self.0[11], self.0[12], self.0[13], self.0[14], self.0[15]
            )
        }
    }

    impl fmt::Debug for Uuid {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "Uuid({})", self)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_project_works() {
        let project = CloudAdapter::create_project("Test Project".to_string(), "user123".to_string());
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.owner_id, "user123");
        assert_eq!(project.version, 1);
    }

    #[test]
    fn add_collaborator_works() {
        let mut project = CloudAdapter::create_project("Test".to_string(), "owner".to_string());
        let result = CloudAdapter::add_collaborator(
            &mut project,
            "user1".to_string(),
            "user1@example.com".to_string(),
            CollaboratorRole::Editor,
        );
        assert!(result.is_ok());
        assert_eq!(project.collaborators.len(), 1);
    }

    #[test]
    fn backup_creation_and_verification_works() {
        let data = b"test project data";
        let backup = CloudAdapter::create_backup("proj1".to_string(), 1, data);
        assert!(CloudAdapter::verify_backup(&backup, data));
    }
}
