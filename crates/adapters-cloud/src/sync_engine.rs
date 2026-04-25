use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEvent {
    pub id: String,
    pub user_id: String,
    pub timestamp_ms: u64,
    pub operation: SyncOperation,
    pub version: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncOperation {
    ComponentAdded { component_id: String, data: String },
    ComponentModified { component_id: String, changes: String },
    ComponentDeleted { component_id: String },
    NetAdded { net_id: String, data: String },
    NetModified { net_id: String, changes: String },
    NetDeleted { net_id: String },
    TraceAdded { trace_id: String, data: String },
    TraceModified { trace_id: String, changes: String },
    TraceDeleted { trace_id: String },
    ProjectMetaUpdated { meta_data: String },
}

pub struct SyncEngine {
    pub event_log: VecDeque<SyncEvent>,
    pub max_events: usize,
    pub current_version: u64,
}

impl SyncEngine {
    pub fn new(max_events: usize) -> Self {
        Self {
            event_log: VecDeque::with_capacity(max_events),
            max_events,
            current_version: 0,
        }
    }

    pub fn record_event(&mut self, user_id: String, operation: SyncOperation) -> SyncEvent {
        self.current_version += 1;
        let event = SyncEvent {
            id: format!("evt_{}", self.current_version),
            user_id,
            timestamp_ms: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
            operation,
            version: self.current_version,
        };

        if self.event_log.len() >= self.max_events {
            self.event_log.pop_front();
        }
        self.event_log.push_back(event.clone());
        event
    }

    pub fn get_events_since(&self, version: u64) -> Vec<SyncEvent> {
        self.event_log
            .iter()
            .filter(|e| e.version > version)
            .cloned()
            .collect()
    }

    pub fn get_conflict_resolution(&self, event1: &SyncEvent, event2: &SyncEvent) -> ConflictResolution {
        // Simple Last-Write-Wins (LWW) strategy
        if event1.timestamp_ms > event2.timestamp_ms {
            ConflictResolution::KeepEvent1
        } else if event2.timestamp_ms > event1.timestamp_ms {
            ConflictResolution::KeepEvent2
        } else {
            // Same timestamp: use user_id as tiebreaker
            if event1.user_id > event2.user_id {
                ConflictResolution::KeepEvent1
            } else {
                ConflictResolution::KeepEvent2
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConflictResolution {
    KeepEvent1,
    KeepEvent2,
    Merge,
}

pub struct CloudBackupManager {
    pub backup_interval_ms: u64,
    pub last_backup_ms: u64,
    pub backup_count: usize,
}

impl CloudBackupManager {
    pub fn new(backup_interval_ms: u64) -> Self {
        Self {
            backup_interval_ms,
            last_backup_ms: 0,
            backup_count: 0,
        }
    }

    pub fn should_backup_now(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        now - self.last_backup_ms >= self.backup_interval_ms
    }

    pub fn record_backup(&mut self) {
        self.last_backup_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        self.backup_count += 1;
    }

    pub fn get_backup_status(&self) -> BackupStatus {
        BackupStatus {
            total_backups: self.backup_count,
            last_backup_ms: self.last_backup_ms,
            next_backup_ms: self.last_backup_ms + self.backup_interval_ms,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupStatus {
    pub total_backups: usize,
    pub last_backup_ms: u64,
    pub next_backup_ms: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sync_engine_records_events() {
        let mut engine = SyncEngine::new(100);
        let op = SyncOperation::ComponentAdded {
            component_id: "comp_1".to_string(),
            data: "{}".to_string(),
        };
        let event = engine.record_event("user_1".to_string(), op);
        
        assert_eq!(event.version, 1);
        assert_eq!(engine.event_log.len(), 1);
    }

    #[test]
    fn sync_engine_retrieves_events_since_version() {
        let mut engine = SyncEngine::new(100);
        for i in 0..5 {
            let op = SyncOperation::ComponentAdded {
                component_id: format!("comp_{}", i),
                data: "{}".to_string(),
            };
            engine.record_event("user_1".to_string(), op);
        }
        
        let events = engine.get_events_since(2);
        assert_eq!(events.len(), 3);
        assert_eq!(events[0].version, 3);
    }

    #[test]
    fn backup_manager_tracks_backups() {
        let mut manager = CloudBackupManager::new(60000);
        assert!(manager.should_backup_now());
        manager.record_backup();
        assert!(!manager.should_backup_now());
        assert_eq!(manager.backup_count, 1);
    }
}
