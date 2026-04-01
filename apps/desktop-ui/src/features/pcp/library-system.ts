export type LibraryKind = "symbol" | "footprint" | "model3d";

export type LibraryEntry = {
  id: string;
  kind: LibraryKind;
  name: string;
  version: string;
  tags: string[];
  metadata: Record<string, string>;
  payload: string;
  createdAt: number;
  updatedAt: number;
};

export type LibraryIndex = {
  entries: LibraryEntry[];
};

function now() {
  return Date.now();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)),
  );
}

export function createLibraryIndex(): LibraryIndex {
  return { entries: [] };
}

export function addLibraryEntry(
  index: LibraryIndex,
  input: Omit<LibraryEntry, "id" | "createdAt" | "updatedAt" | "tags"> & { tags?: string[] },
): LibraryIndex {
  const created: LibraryEntry = {
    ...input,
    id: id(`lib-${input.kind}`),
    tags: normalizeTags(input.tags ?? []),
    createdAt: now(),
    updatedAt: now(),
  };
  return {
    entries: [...index.entries, created],
  };
}

export function updateLibraryEntry(
  index: LibraryIndex,
  entryId: string,
  patch: Partial<Omit<LibraryEntry, "id" | "createdAt" | "updatedAt">>,
): LibraryIndex {
  return {
    entries: index.entries.map((entry) => {
      if (entry.id !== entryId) {
        return entry;
      }
      return {
        ...entry,
        ...patch,
        tags: patch.tags ? normalizeTags(patch.tags) : entry.tags,
        updatedAt: now(),
      };
    }),
  };
}

export function deleteLibraryEntry(index: LibraryIndex, entryId: string): LibraryIndex {
  return {
    entries: index.entries.filter((entry) => entry.id !== entryId),
  };
}

export function searchLibraryEntries(
  index: LibraryIndex,
  query: string,
  options?: {
    kind?: LibraryKind;
    tags?: string[];
  },
) {
  const normalized = query.trim().toLowerCase();
  const requiredTags = normalizeTags(options?.tags ?? []);

  return index.entries
    .filter((entry) => (options?.kind ? entry.kind === options.kind : true))
    .filter((entry) =>
      requiredTags.length > 0 ? requiredTags.every((tag) => entry.tags.includes(tag)) : true,
    )
    .filter((entry) => {
      if (!normalized) {
        return true;
      }
      return (
        entry.name.toLowerCase().includes(normalized) ||
        entry.version.toLowerCase().includes(normalized) ||
        entry.tags.some((tag) => tag.includes(normalized))
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function buildLibraryKindStats(index: LibraryIndex) {
  const stats: Record<LibraryKind, number> = {
    symbol: 0,
    footprint: 0,
    model3d: 0,
  };
  for (const entry of index.entries) {
    stats[entry.kind] += 1;
  }
  return stats;
}

export function exportLibraryIndex(index: LibraryIndex) {
  return JSON.stringify(index, null, 2);
}

export function importLibraryIndex(text: string): LibraryIndex {
  const parsed = JSON.parse(text) as Partial<LibraryIndex>;
  if (!parsed || !Array.isArray(parsed.entries)) {
    return createLibraryIndex();
  }

  const entries = parsed.entries
    .filter((entry): entry is LibraryEntry => Boolean(entry && typeof entry.id === "string"))
    .map((entry) => ({
      ...entry,
      tags: normalizeTags(entry.tags ?? []),
      metadata: entry.metadata ?? {},
    }));

  return { entries };
}
