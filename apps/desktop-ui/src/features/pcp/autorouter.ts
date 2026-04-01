import type { Point } from "./board-kernel";
import {
  createRouterGrid,
  routeAStar,
  routeWithFallback,
  setBlockedCells,
  type RouteCandidate,
} from "./interactive-router";

export type AutoRouteRequest = {
  net: string;
  start: Point;
  end: Point;
};

export type AutoRouteResult = {
  net: string;
  route: RouteCandidate;
  strategy: "astar" | "fallback";
};

export type AutoRouteSummary = {
  requested: number;
  routed: number;
  failed: number;
  totalCost: number;
};

export type AutoRouterConfig = {
  width: number;
  height: number;
  step: number;
  blockedPoints: Point[];
  ripupRetries: number;
};

function routeOne(
  config: AutoRouterConfig,
  blocked: Point[],
  request: AutoRouteRequest,
): AutoRouteResult {
  const grid = setBlockedCells(createRouterGrid(config.width, config.height, config.step), blocked);
  const astar = routeAStar(grid, request.start, request.end);
  if (astar) {
    return {
      net: request.net,
      route: astar,
      strategy: "astar",
    };
  }
  return {
    net: request.net,
    route: routeWithFallback(grid, request.start, request.end),
    strategy: "fallback",
  };
}

function routeBlockedPoints(result: AutoRouteResult) {
  return result.route.points;
}

export function runAutorouter(
  config: AutoRouterConfig,
  requests: AutoRouteRequest[],
): {
  routes: AutoRouteResult[];
  summary: AutoRouteSummary;
} {
  const retries = Math.max(0, Math.round(config.ripupRetries));
  let blocked = [...config.blockedPoints];
  let routes: AutoRouteResult[] = [];

  const attempt = () => {
    const nextRoutes: AutoRouteResult[] = [];
    let currentBlocked = [...blocked];
    for (const request of requests) {
      const result = routeOne(config, currentBlocked, request);
      nextRoutes.push(result);
      currentBlocked = [...currentBlocked, ...routeBlockedPoints(result)];
    }
    return nextRoutes;
  };

  routes = attempt();
  let bestCost = routes.reduce((sum, route) => sum + route.route.cost, 0);

  for (let retry = 0; retry < retries; retry += 1) {
    blocked = config.blockedPoints.filter((_, index) => index % (retry + 2) !== 0);
    const candidate = attempt();
    const candidateCost = candidate.reduce((sum, route) => sum + route.route.cost, 0);
    if (candidateCost < bestCost) {
      routes = candidate;
      bestCost = candidateCost;
    }
  }

  const summary: AutoRouteSummary = {
    requested: requests.length,
    routed: routes.length,
    failed: 0,
    totalCost: routes.reduce((sum, route) => sum + route.route.cost, 0),
  };

  return {
    routes,
    summary,
  };
}

export function optimizeRouteOrder(requests: AutoRouteRequest[]) {
  return [...requests].sort((a, b) => {
    const spanA = Math.abs(a.end.x - a.start.x) + Math.abs(a.end.y - a.start.y);
    const spanB = Math.abs(b.end.x - b.start.x) + Math.abs(b.end.y - b.start.y);
    return spanB - spanA;
  });
}

export function routeQualityScore(results: AutoRouteResult[]) {
  if (results.length === 0) {
    return 0;
  }
  const base = 100;
  const penalty = results.reduce((sum, route) => {
    const strategyPenalty = route.strategy === "fallback" ? 8 : 0;
    return sum + Math.min(20, Math.round(route.route.cost / 100)) + strategyPenalty;
  }, 0);
  return Math.max(0, Math.round(base - penalty / results.length));
}
