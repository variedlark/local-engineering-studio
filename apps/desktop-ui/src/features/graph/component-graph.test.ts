import { describe, expect, it } from "vitest";
import {
  buildAdjacency,
  connectedComponents,
  edgeCrossings,
  graphDensity,
  hasCycle,
  isConnected,
  nodeDegreeMap,
  shortestPath,
  topologicalLayers,
  type ComponentGraph,
} from "./component-graph";

const graph: ComponentGraph = {
  nodes: [
    { id: "a", label: "A", layer: 0, x: 0, y: 0 },
    { id: "b", label: "B", layer: 0, x: 10, y: 0 },
    { id: "c", label: "C", layer: 0, x: 20, y: 0 },
    { id: "d", label: "D", layer: 0, x: 0, y: 10 },
  ],
  edges: [
    { id: "e1", from: "a", to: "b", weight: 1 },
    { id: "e2", from: "b", to: "c", weight: 2 },
    { id: "e3", from: "a", to: "d", weight: 4 },
  ],
};

describe("component-graph", () => {
  it("builds adjacency and degrees", () => {
    const adjacency = buildAdjacency(graph);
    expect(adjacency.get("a")?.length).toBe(2);

    const degrees = nodeDegreeMap(graph);
    expect(degrees.get("a")).toBe(2);
  });

  it("computes connectivity and components", () => {
    expect(isConnected(graph)).toBe(true);
    const components = connectedComponents(graph);
    expect(components.length).toBe(1);
  });

  it("computes shortest path", () => {
    const path = shortestPath(graph, "a", "c");
    expect(path?.path).toEqual(["a", "b", "c"]);
  });

  it("detects cycles and layers", () => {
    expect(hasCycle(graph)).toBe(false);
    const layers = topologicalLayers(graph);
    expect(layers?.length).toBeGreaterThan(0);
  });

  it("computes crossings and density", () => {
    expect(edgeCrossings(graph).length).toBe(0);
    expect(graphDensity(graph)).toBeGreaterThan(0);
  });
});
