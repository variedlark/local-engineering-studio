import type { BoardModel } from "./board-kernel";

export type BackupSnapshot = {
  id: string;
  createdAt: number;
  checksum: string;
  board: BoardModel;
};

export type ReliabilityReport = {
  valid: boolean;
  checksum: string;
  backupCount: number;
  issues: string[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function hash(text: string) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(value)}`;
}

export function boardChecksum(board: BoardModel) {
  return hash(JSON.stringify(board));
}

export function createBackup(board: BoardModel): BackupSnapshot {
  return {
    id: uid("backup"),
    createdAt: Date.now(),
    checksum: boardChecksum(board),
    board,
  };
}

export function verifyBackup(snapshot: BackupSnapshot) {
  return snapshot.checksum === boardChecksum(snapshot.board);
}

export function restoreBackup(snapshot: BackupSnapshot): BoardModel {
  return JSON.parse(JSON.stringify(snapshot.board)) as BoardModel;
}

export function runReliabilityChecks(board: BoardModel, backups: BackupSnapshot[]): ReliabilityReport {
  const issues: string[] = [];
  const checksum = boardChecksum(board);

  if (backups.length === 0) {
    issues.push("No backups available");
  }
  for (const snapshot of backups) {
    if (!verifyBackup(snapshot)) {
      issues.push(`Backup ${snapshot.id} checksum mismatch`);
    }
  }

  return {
    valid: issues.length === 0,
    checksum,
    backupCount: backups.length,
    issues,
  };
}

export function pruneBackups(backups: BackupSnapshot[], maxCount: number) {
  const safe = Math.max(1, Math.round(maxCount));
  return [...backups].sort((a, b) => b.createdAt - a.createdAt).slice(0, safe);
}
