import {
  applyBulkTransition,
  buildBurndown,
  createWorkItem,
  detectBlockedWorkItems,
  estimateCompletionDate,
  groupWorkItemsByStatus,
  mergeWorkItemLists,
  sortWorkItems,
  type BurnDownPoint,
  type WorkItem,
  type WorkItemStatus,
} from "./work-item";

export type PlanBoard = {
  items: WorkItem[];
  createdAt: number;
  updatedAt: number;
  sprintDays: number;
  dailyCapacityHours: number;
};

export type PlanBoardSummary = {
  totalItems: number;
  doneItems: number;
  blockedItems: number;
  completionEstimate: number;
  burndown: BurnDownPoint[];
};

function now() {
  return Date.now();
}

export function createPlanBoard(input?: {
  sprintDays?: number;
  dailyCapacityHours?: number;
}): PlanBoard {
  const createdAt = now();
  return {
    items: [],
    createdAt,
    updatedAt: createdAt,
    sprintDays: Math.max(1, Math.round(input?.sprintDays ?? 10)),
    dailyCapacityHours: Math.max(1, Math.round(input?.dailyCapacityHours ?? 6)),
  };
}

export function addPlanItem(
  board: PlanBoard,
  item: Parameters<typeof createWorkItem>[0],
): PlanBoard {
  const nextItems = sortWorkItems([...board.items, createWorkItem(item)]);
  return {
    ...board,
    items: nextItems,
    updatedAt: now(),
  };
}

export function removePlanItem(board: PlanBoard, id: string): PlanBoard {
  return {
    ...board,
    items: board.items.filter((item) => item.id !== id),
    updatedAt: now(),
  };
}

export function setPlanItemStatus(
  board: PlanBoard,
  ids: string[],
  status: WorkItemStatus,
): PlanBoard {
  return {
    ...board,
    items: sortWorkItems(applyBulkTransition(board.items, ids, status)),
    updatedAt: now(),
  };
}

export function mergePlanBoards(primary: PlanBoard, secondary: PlanBoard): PlanBoard {
  const mergedItems = sortWorkItems(mergeWorkItemLists(primary.items, secondary.items));
  return {
    ...primary,
    items: mergedItems,
    updatedAt: now(),
  };
}

export function summarizePlanBoard(board: PlanBoard): PlanBoardSummary {
  const grouped = groupWorkItemsByStatus(board.items);
  const blocked = detectBlockedWorkItems(board.items);
  const completionEstimate = estimateCompletionDate(board.items, board.dailyCapacityHours);
  const burndown = buildBurndown(board.items, board.sprintDays);

  return {
    totalItems: board.items.length,
    doneItems: grouped.done.length,
    blockedItems: blocked.length,
    completionEstimate,
    burndown,
  };
}

export function boardHealth(board: PlanBoard) {
  const summary = summarizePlanBoard(board);
  if (summary.totalItems === 0) {
    return "empty" as const;
  }
  const doneRatio = summary.doneItems / summary.totalItems;
  if (summary.blockedItems > 0 && doneRatio < 0.5) {
    return "at_risk" as const;
  }
  if (doneRatio >= 0.75) {
    return "healthy" as const;
  }
  return "watch" as const;
}
