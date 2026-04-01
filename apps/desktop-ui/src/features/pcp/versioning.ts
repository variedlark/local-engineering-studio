export type ArtifactVersion<TPayload = unknown> = {
  id: string;
  revision: number;
  parentId: string | null;
  branch: string;
  author: string;
  message: string;
  createdAt: number;
  payload: TPayload;
};

export type ArtifactHistory<TPayload = unknown> = {
  versions: ArtifactVersion<TPayload>[];
  branches: string[];
  currentVersionId: string | null;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createHistory<TPayload>(initialPayload: TPayload, author = "system"): ArtifactHistory<TPayload> {
  const root: ArtifactVersion<TPayload> = {
    id: uid("ver"),
    revision: 1,
    parentId: null,
    branch: "main",
    author,
    message: "Initial version",
    createdAt: Date.now(),
    payload: initialPayload,
  };
  return {
    versions: [root],
    branches: ["main"],
    currentVersionId: root.id,
  };
}

function currentVersion<TPayload>(history: ArtifactHistory<TPayload>) {
  if (!history.currentVersionId) {
    return null;
  }
  return history.versions.find((version) => version.id === history.currentVersionId) ?? null;
}

export function commitVersion<TPayload>(
  history: ArtifactHistory<TPayload>,
  input: {
    payload: TPayload;
    author: string;
    message: string;
    branch?: string;
  },
): ArtifactHistory<TPayload> {
  const parent = currentVersion(history);
  const branch = input.branch ?? parent?.branch ?? "main";
  const revision = history.versions.reduce((max, version) => Math.max(max, version.revision), 0) + 1;

  const created: ArtifactVersion<TPayload> = {
    id: uid("ver"),
    revision,
    parentId: parent?.id ?? null,
    branch,
    author: input.author,
    message: input.message.trim() || "Update",
    createdAt: Date.now(),
    payload: input.payload,
  };

  return {
    versions: [...history.versions, created],
    branches: history.branches.includes(branch) ? history.branches : [...history.branches, branch],
    currentVersionId: created.id,
  };
}

export function checkoutVersion<TPayload>(history: ArtifactHistory<TPayload>, versionId: string) {
  if (!history.versions.some((version) => version.id === versionId)) {
    return history;
  }
  return {
    ...history,
    currentVersionId: versionId,
  };
}

export function createBranch<TPayload>(
  history: ArtifactHistory<TPayload>,
  branch: string,
): ArtifactHistory<TPayload> {
  const normalized = branch.trim();
  if (!normalized || history.branches.includes(normalized)) {
    return history;
  }
  return {
    ...history,
    branches: [...history.branches, normalized],
  };
}

export function mergeBranch<TPayload>(
  history: ArtifactHistory<TPayload>,
  sourceBranch: string,
  targetBranch: string,
  author: string,
): ArtifactHistory<TPayload> {
  const sourceHead = [...history.versions]
    .filter((version) => version.branch === sourceBranch)
    .sort((a, b) => b.revision - a.revision)[0];
  const targetHead = [...history.versions]
    .filter((version) => version.branch === targetBranch)
    .sort((a, b) => b.revision - a.revision)[0];

  if (!sourceHead || !targetHead) {
    return history;
  }

  const mergedPayload = sourceHead.payload;
  return commitVersion(history, {
    payload: mergedPayload,
    author,
    message: `Merge ${sourceBranch} into ${targetBranch}`,
    branch: targetBranch,
  });
}

export function versionDiff<TPayload extends Record<string, unknown>>(
  a: ArtifactVersion<TPayload>,
  b: ArtifactVersion<TPayload>,
) {
  const keys = new Set([...Object.keys(a.payload), ...Object.keys(b.payload)]);
  const changes: Array<{ key: string; before: unknown; after: unknown }> = [];
  for (const key of keys) {
    const before = a.payload[key];
    const after = b.payload[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ key, before, after });
    }
  }
  return changes;
}

export function summarizeHistory<TPayload>(history: ArtifactHistory<TPayload>) {
  const current = currentVersion(history);
  return {
    versionCount: history.versions.length,
    branchCount: history.branches.length,
    currentRevision: current?.revision ?? 0,
    currentBranch: current?.branch ?? null,
  };
}
