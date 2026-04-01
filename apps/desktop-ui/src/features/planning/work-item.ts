export type WorkItemPriority = "p0" | "p1" | "p2" | "p3";

export type WorkItemStatus = "todo" | "in_progress" | "blocked" | "done";

export type WorkItem = {
  id: string;
  title: string;
  description: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  estimateHours: number;
  createdAt: number;
  updatedAt: number;
  dueAt: number | null;
  tags: string[];
  dependencies: string[];
};

export type BurnDownPoint = {
  day: number;
  remainingHours: number;
};

function workItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeText(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
}

function sanitizeHours(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.round(value));
}

function sanitizePriority(priority: WorkItemPriority) {
  const allowed: WorkItemPriority[] = ["p0", "p1", "p2", "p3"];
  return allowed.includes(priority) ? priority : "p2";
}

function sanitizeStatus(status: WorkItemStatus) {
  const allowed: WorkItemStatus[] = ["todo", "in_progress", "blocked", "done"];
  return allowed.includes(status) ? status : "todo";
}

function sanitizeTags(tags: string[]) {
  const deduped = new Set<string>();
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) {
      continue;
    }
    deduped.add(normalized);
  }
  return Array.from(deduped);
}

function sanitizeDependencies(dependencies: string[], selfId: string) {
  const deduped = new Set<string>();
  for (const id of dependencies) {
    const normalized = id.trim();
    if (!normalized || normalized === selfId) {
      continue;
    }
    deduped.add(normalized);
  }
  return Array.from(deduped);
}

export function createWorkItem(input: {
  title: string;
  description?: string;
  priority?: WorkItemPriority;
  estimateHours?: number;
  dueAt?: number | null;
  tags?: string[];
  dependencies?: string[];
}): WorkItem {
  const createdAt = Date.now();
  const id = workItemId();
  return {
    id,
    title: sanitizeText(input.title, "Untitled work item"),
    description: sanitizeText(input.description ?? "", "No description"),
    priority: sanitizePriority(input.priority ?? "p2"),
    status: "todo",
    estimateHours: sanitizeHours(input.estimateHours ?? 2),
    createdAt,
    updatedAt: createdAt,
    dueAt: input.dueAt ?? null,
    tags: sanitizeTags(input.tags ?? []),
    dependencies: sanitizeDependencies(input.dependencies ?? [], id),
  };
}

export function updateWorkItem(
  workItem: WorkItem,
  patch: Partial<Omit<WorkItem, "id" | "createdAt">>,
): WorkItem {
  const nextTitle = patch.title !== undefined ? sanitizeText(patch.title, workItem.title) : workItem.title;
  const nextDescription =
    patch.description !== undefined
      ? sanitizeText(patch.description, workItem.description)
      : workItem.description;
  const nextPriority =
    patch.priority !== undefined ? sanitizePriority(patch.priority) : workItem.priority;
  const nextStatus = patch.status !== undefined ? sanitizeStatus(patch.status) : workItem.status;
  const nextEstimateHours =
    patch.estimateHours !== undefined
      ? sanitizeHours(patch.estimateHours)
      : workItem.estimateHours;
  const nextDueAt = patch.dueAt !== undefined ? patch.dueAt : workItem.dueAt;
  const nextTags = patch.tags !== undefined ? sanitizeTags(patch.tags) : workItem.tags;
  const nextDependencies =
    patch.dependencies !== undefined
      ? sanitizeDependencies(patch.dependencies, workItem.id)
      : workItem.dependencies;

  return {
    ...workItem,
    title: nextTitle,
    description: nextDescription,
    priority: nextPriority,
    status: nextStatus,
    estimateHours: nextEstimateHours,
    dueAt: nextDueAt,
    tags: nextTags,
    dependencies: nextDependencies,
    updatedAt: Date.now(),
  };
}

export function workItemPriorityWeight(priority: WorkItemPriority) {
  if (priority === "p0") {
    return 100;
  }
  if (priority === "p1") {
    return 70;
  }
  if (priority === "p2") {
    return 45;
  }
  return 20;
}

export function workItemStatusWeight(status: WorkItemStatus) {
  if (status === "blocked") {
    return -35;
  }
  if (status === "done") {
    return -80;
  }
  if (status === "in_progress") {
    return 12;
  }
  return 0;
}

export function scoreWorkItem(workItem: WorkItem, now = Date.now()) {
  let score = workItemPriorityWeight(workItem.priority) + workItemStatusWeight(workItem.status);

  if (workItem.dueAt !== null) {
    const hoursToDue = Math.round((workItem.dueAt - now) / (1000 * 60 * 60));
    if (hoursToDue <= 0) {
      score += 45;
    } else if (hoursToDue <= 24) {
      score += 30;
    } else if (hoursToDue <= 72) {
      score += 18;
    }
  }

  if (workItem.dependencies.length > 0) {
    score += Math.min(12, workItem.dependencies.length * 3);
  }

  if (workItem.estimateHours >= 16) {
    score += 9;
  }

  return score;
}

export function sortWorkItems(workItems: WorkItem[], now = Date.now()) {
  const copy = [...workItems];
  copy.sort((a, b) => {
    const scoreDiff = scoreWorkItem(b, now) - scoreWorkItem(a, now);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    if (a.status !== b.status) {
      return a.status.localeCompare(b.status);
    }
    return b.updatedAt - a.updatedAt;
  });
  return copy;
}

export function groupWorkItemsByStatus(workItems: WorkItem[]) {
  const groups: Record<WorkItemStatus, WorkItem[]> = {
    todo: [],
    in_progress: [],
    blocked: [],
    done: [],
  };

  for (const workItem of workItems) {
    groups[workItem.status].push(workItem);
  }

  return groups;
}

export function applyBulkTransition(
  workItems: WorkItem[],
  ids: string[],
  status: WorkItemStatus,
) {
  const idSet = new Set(ids);
  return workItems.map((workItem) => {
    if (!idSet.has(workItem.id)) {
      return workItem;
    }
    return updateWorkItem(workItem, { status });
  });
}

export function detectBlockedWorkItems(workItems: WorkItem[]) {
  const doneSet = new Set(workItems.filter((workItem) => workItem.status === "done").map((workItem) => workItem.id));
  return workItems.filter((workItem) => {
    if (workItem.status === "done") {
      return false;
    }
    return workItem.dependencies.some((dependency) => !doneSet.has(dependency));
  });
}

export function estimateCompletionDate(workItems: WorkItem[], dailyCapacityHours: number) {
  const active = workItems.filter((workItem) => workItem.status !== "done");
  if (active.length === 0) {
    return Date.now();
  }
  const totalHours = active.reduce((sum, workItem) => sum + workItem.estimateHours, 0);
  const safeCapacity = Math.max(1, Math.round(dailyCapacityHours));
  const days = Math.ceil(totalHours / safeCapacity);
  const millisPerDay = 24 * 60 * 60 * 1000;
  return Date.now() + days * millisPerDay;
}

export function mergeWorkItemLists(primary: WorkItem[], secondary: WorkItem[]) {
  const byId = new Map<string, WorkItem>();
  for (const workItem of secondary) {
    byId.set(workItem.id, workItem);
  }
  for (const workItem of primary) {
    const existing = byId.get(workItem.id);
    if (!existing) {
      byId.set(workItem.id, workItem);
      continue;
    }
    byId.set(workItem.id, existing.updatedAt > workItem.updatedAt ? existing : workItem);
  }
  return Array.from(byId.values());
}

export function buildBurndown(workItems: WorkItem[], sprintDays: number): BurnDownPoint[] {
  const safeDays = Math.max(1, Math.round(sprintDays));
  const remaining = workItems
    .filter((workItem) => workItem.status !== "done")
    .reduce((sum, workItem) => sum + workItem.estimateHours, 0);

  const points: BurnDownPoint[] = [];
  for (let day = 0; day <= safeDays; day += 1) {
    const ratio = day / safeDays;
    const hours = Math.max(0, Math.round(remaining * (1 - ratio)));
    points.push({ day, remainingHours: hours });
  }
  return points;
}
