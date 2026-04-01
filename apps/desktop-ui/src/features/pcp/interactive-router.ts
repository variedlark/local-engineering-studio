import type { Point } from "./board-kernel";

export type RouterGridCell = {
  x: number;
  y: number;
  blocked: boolean;
  cost: number;
};

export type RouterGrid = {
  width: number;
  height: number;
  step: number;
  cells: RouterGridCell[];
};

export type RouteCandidate = {
  points: Point[];
  cost: number;
};

function key(x: number, y: number) {
  return `${x},${y}`;
}

function snap(value: number, step: number) {
  return Math.round(value / step) * step;
}

function normalizePoint(point: Point, step: number) {
  return {
    x: snap(point.x, step),
    y: snap(point.y, step),
  };
}

function neighborPoints(point: Point, step: number): Point[] {
  return [
    { x: point.x + step, y: point.y },
    { x: point.x - step, y: point.y },
    { x: point.x, y: point.y + step },
    { x: point.x, y: point.y - step },
  ];
}

function inBounds(point: Point, grid: RouterGrid) {
  return point.x >= 0 && point.y >= 0 && point.x <= grid.width && point.y <= grid.height;
}

function blockedSet(grid: RouterGrid) {
  const set = new Set<string>();
  for (const cell of grid.cells) {
    if (cell.blocked) {
      set.add(key(cell.x, cell.y));
    }
  }
  return set;
}

function cellCost(grid: RouterGrid) {
  const map = new Map<string, number>();
  for (const cell of grid.cells) {
    map.set(key(cell.x, cell.y), cell.cost);
  }
  return map;
}

function heuristic(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom: Map<string, Point>, current: Point): Point[] {
  const path: Point[] = [current];
  let cursor = current;
  while (cameFrom.has(key(cursor.x, cursor.y))) {
    const previous = cameFrom.get(key(cursor.x, cursor.y))!;
    path.push(previous);
    cursor = previous;
  }
  return path.reverse();
}

export function createRouterGrid(width: number, height: number, step: number): RouterGrid {
  const safeStep = Math.max(1, Math.round(step));
  const cells: RouterGridCell[] = [];
  for (let y = 0; y <= height; y += safeStep) {
    for (let x = 0; x <= width; x += safeStep) {
      cells.push({ x, y, blocked: false, cost: 1 });
    }
  }
  return {
    width: Math.max(0, Math.round(width)),
    height: Math.max(0, Math.round(height)),
    step: safeStep,
    cells,
  };
}

export function setBlockedCells(grid: RouterGrid, points: Point[]): RouterGrid {
  const blocked = new Set(points.map((point) => key(snap(point.x, grid.step), snap(point.y, grid.step))));
  return {
    ...grid,
    cells: grid.cells.map((cell) => ({
      ...cell,
      blocked: blocked.has(key(cell.x, cell.y)),
    })),
  };
}

export function setCellCosts(grid: RouterGrid, costs: Array<{ point: Point; cost: number }>): RouterGrid {
  const map = new Map<string, number>();
  for (const entry of costs) {
    map.set(
      key(snap(entry.point.x, grid.step), snap(entry.point.y, grid.step)),
      Math.max(1, Math.round(entry.cost)),
    );
  }

  return {
    ...grid,
    cells: grid.cells.map((cell) => ({
      ...cell,
      cost: map.get(key(cell.x, cell.y)) ?? cell.cost,
    })),
  };
}

export function routeAStar(grid: RouterGrid, start: Point, goal: Point): RouteCandidate | null {
  const snappedStart = normalizePoint(start, grid.step);
  const snappedGoal = normalizePoint(goal, grid.step);
  const blocked = blockedSet(grid);
  const costs = cellCost(grid);

  if (!inBounds(snappedStart, grid) || !inBounds(snappedGoal, grid)) {
    return null;
  }
  if (blocked.has(key(snappedStart.x, snappedStart.y)) || blocked.has(key(snappedGoal.x, snappedGoal.y))) {
    return null;
  }

  const open = new Set<string>([key(snappedStart.x, snappedStart.y)]);
  const openPoints = new Map<string, Point>([[key(snappedStart.x, snappedStart.y), snappedStart]]);
  const cameFrom = new Map<string, Point>();
  const gScore = new Map<string, number>([[key(snappedStart.x, snappedStart.y), 0]]);
  const fScore = new Map<string, number>([
    [key(snappedStart.x, snappedStart.y), heuristic(snappedStart, snappedGoal)],
  ]);

  while (open.size > 0) {
    let currentKey: string | null = null;
    let currentScore = Number.POSITIVE_INFINITY;
    for (const candidateKey of open) {
      const score = fScore.get(candidateKey) ?? Number.POSITIVE_INFINITY;
      if (score < currentScore) {
        currentScore = score;
        currentKey = candidateKey;
      }
    }

    if (!currentKey) {
      break;
    }

    const current = openPoints.get(currentKey)!;
    if (current.x === snappedGoal.x && current.y === snappedGoal.y) {
      const path = reconstructPath(cameFrom, current);
      const totalCost = gScore.get(currentKey) ?? 0;
      return {
        points: path,
        cost: totalCost,
      };
    }

    open.delete(currentKey);
    openPoints.delete(currentKey);

    for (const neighbor of neighborPoints(current, grid.step)) {
      if (!inBounds(neighbor, grid)) {
        continue;
      }
      const neighborKey = key(neighbor.x, neighbor.y);
      if (blocked.has(neighborKey)) {
        continue;
      }

      const tentative =
        (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) +
        (costs.get(neighborKey) ?? 1) +
        grid.step;

      if (tentative < (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentative);
        fScore.set(neighborKey, tentative + heuristic(neighbor, snappedGoal));
        open.add(neighborKey);
        openPoints.set(neighborKey, neighbor);
      }
    }
  }

  return null;
}

export function routeManhattanFallback(start: Point, goal: Point, step: number): RouteCandidate {
  const safeStep = Math.max(1, Math.round(step));
  const a = normalizePoint(start, safeStep);
  const b = normalizePoint(goal, safeStep);

  const points: Point[] = [a];
  if (a.x !== b.x) {
    points.push({ x: b.x, y: a.y });
  }
  if (a.y !== b.y) {
    points.push({ x: b.x, y: b.y });
  }

  const cost = heuristic(a, b);
  return { points, cost };
}

export function simplifyRoute(points: Point[]) {
  if (points.length <= 2) {
    return points;
  }
  const simplified: Point[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = simplified[simplified.length - 1]!;
    const current = points[i]!;
    const next = points[i + 1]!;
    const collinear = (prev.x === current.x && current.x === next.x) || (prev.y === current.y && current.y === next.y);
    if (!collinear) {
      simplified.push(current);
    }
  }
  simplified.push(points[points.length - 1]!);
  return simplified;
}

export function routeWithFallback(grid: RouterGrid, start: Point, goal: Point): RouteCandidate {
  const astar = routeAStar(grid, start, goal);
  if (astar) {
    return {
      points: simplifyRoute(astar.points),
      cost: astar.cost,
    };
  }
  const fallback = routeManhattanFallback(start, goal, grid.step);
  return {
    points: simplifyRoute(fallback.points),
    cost: fallback.cost,
  };
}
