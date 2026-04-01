import { describe, expect, it } from "vitest";
import {
  addLibraryEntry,
  buildLibraryKindStats,
  createLibraryIndex,
  deleteLibraryEntry,
  exportLibraryIndex,
  importLibraryIndex,
  searchLibraryEntries,
  updateLibraryEntry,
} from "./library-system";

describe("library-system", () => {
  it("adds, updates, searches, and deletes entries", () => {
    const base = createLibraryIndex();
    const withSymbol = addLibraryEntry(base, {
      kind: "symbol",
      name: "Resistor",
      version: "1.0.0",
      metadata: { family: "passive" },
      payload: "...",
      tags: ["passive", "r"],
    });
    const entry = withSymbol.entries[0]!;
    const updated = updateLibraryEntry(withSymbol, entry.id, { version: "1.1.0", tags: ["passive"] });
    expect(updated.entries[0]?.version).toBe("1.1.0");

    const searched = searchLibraryEntries(updated, "res", { kind: "symbol" });
    expect(searched).toHaveLength(1);

    const removed = deleteLibraryEntry(updated, entry.id);
    expect(removed.entries).toHaveLength(0);
  });

  it("exports and imports index", () => {
    const withOne = addLibraryEntry(createLibraryIndex(), {
      kind: "footprint",
      name: "QFN-32",
      version: "2.0.0",
      metadata: {},
      payload: "fp",
      tags: ["ic"],
    });
    const json = exportLibraryIndex(withOne);
    const imported = importLibraryIndex(json);
    expect(imported.entries).toHaveLength(1);

    const stats = buildLibraryKindStats(imported);
    expect(stats.footprint).toBe(1);
  });
});
