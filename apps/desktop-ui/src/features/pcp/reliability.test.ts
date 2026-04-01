import { describe, expect, it } from "vitest";
import { createBoard } from "./board-kernel";
import {
  createBackup,
  pruneBackups,
  restoreBackup,
  runReliabilityChecks,
  verifyBackup,
} from "./reliability";

describe("reliability", () => {
  it("creates and verifies backups", () => {
    const board = createBoard(2000, 2000);
    const backup = createBackup(board);
    expect(verifyBackup(backup)).toBe(true);
    const restored = restoreBackup(backup);
    expect(restored.width).toBe(board.width);
  });

  it("runs reliability checks and prunes backups", () => {
    const board = createBoard(2000, 2000);
    const backups = [createBackup(board), createBackup(board), createBackup(board)];
    const report = runReliabilityChecks(board, backups);
    expect(report.valid).toBe(true);
    expect(pruneBackups(backups, 2)).toHaveLength(2);
  });
});
