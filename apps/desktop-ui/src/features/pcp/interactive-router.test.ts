import { describe, expect, it } from "vitest";
import {
  createRouterGrid,
  routeAStar,
  routeWithFallback,
  setBlockedCells,
  simplifyRoute,
} from "./interactive-router";

describe("interactive-router", () => {
  it("routes with astar on open grid", () => {
    const grid = createRouterGrid(100, 100, 10);
    const route = routeAStar(grid, { x: 0, y: 0 }, { x: 40, y: 20 });
    expect(route).not.toBeNull();
    expect(route!.points.length).toBeGreaterThan(1);
  });

  it("falls back when blocked", () => {
    const grid = setBlockedCells(createRouterGrid(100, 100, 10), [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
    const route = routeWithFallback(grid, { x: 0, y: 0 }, { x: 40, y: 0 });
    expect(route.points.length).toBeGreaterThan(1);
  });

  it("simplifies collinear points", () => {
    const simplified = simplifyRoute([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ]);
    expect(simplified).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ]);
  });
});
