export type GraphNode = {
  id: string;
  label: string;
  layer: number;
  x: number;
  y: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  weight: number;
  bidirectional?: boolean;
};

export type ComponentGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphAdjacency = Map<string, Array<{ to: string; weight: number; edgeId: string }>>;

export type EdgeCrossing = {
  a: string;
  b: string;
};

function safeWeight(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.round(value));
}

function nodeMap(nodes: GraphNode[]) {
  const map = new Map<string, GraphNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
}

export function normalizeGraph(graph: ComponentGraph): ComponentGraph {
  const nodes = [...graph.nodes].filter((node, index, arr) => {
    return arr.findIndex((candidate) => candidate.id === node.id) === index;
  });

  const validIds = new Set(nodes.map((node) => node.id));
  const edgeSeen = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const edge of graph.edges) {
    if (!validIds.has(edge.from) || !validIds.has(edge.to) || edge.from === edge.to) {
      continue;
    }
    const key = `${edge.from}:${edge.to}:${edge.bidirectional ? "b" : "d"}`;
    if (edgeSeen.has(key)) {
      continue;
    }
    edgeSeen.add(key);
    edges.push({
      ...edge,
      weight: safeWeight(edge.weight),
    });
  }

  return { nodes, edges };
}

export function buildAdjacency(graph: ComponentGraph): GraphAdjacency {
  const normalized = normalizeGraph(graph);
  const adjacency: GraphAdjacency = new Map();

  for (const node of normalized.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of normalized.edges) {
    adjacency.get(edge.from)?.push({
      to: edge.to,
      weight: edge.weight,
      edgeId: edge.id,
    });
    if (edge.bidirectional) {
      adjacency.get(edge.to)?.push({
        to: edge.from,
        weight: edge.weight,
        edgeId: edge.id,
      });
    }
  }

  return adjacency;
}

export function nodeDegreeMap(graph: ComponentGraph) {
  const adjacency = buildAdjacency(graph);
  const degree = new Map<string, number>();
  for (const [id, neighbors] of adjacency.entries()) {
    degree.set(id, neighbors.length);
  }
  return degree;
}

export function connectedComponents(graph: ComponentGraph) {
  const adjacency = buildAdjacency(graph);
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const id of adjacency.keys()) {
    if (visited.has(id)) {
      continue;
    }
    const queue = [id];
    visited.add(id);
    const current: string[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      current.push(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        if (visited.has(neighbor.to)) {
          continue;
        }
        visited.add(neighbor.to);
        queue.push(neighbor.to);
      }
    }

    components.push(current);
  }

  return components;
}

export function isConnected(graph: ComponentGraph) {
  const normalized = normalizeGraph(graph);
  if (normalized.nodes.length <= 1) {
    return true;
  }
  return connectedComponents(normalized).length === 1;
}

export function shortestPath(graph: ComponentGraph, start: string, goal: string) {
  const adjacency = buildAdjacency(graph);
  if (!adjacency.has(start) || !adjacency.has(goal)) {
    return null;
  }

  const distance = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const id of adjacency.keys()) {
    distance.set(id, Number.POSITIVE_INFINITY);
    previous.set(id, null);
  }
  distance.set(start, 0);

  while (visited.size < adjacency.size) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;

    for (const [id, value] of distance.entries()) {
      if (visited.has(id)) {
        continue;
      }
      if (value < best) {
        best = value;
        current = id;
      }
    }

    if (current === null || best === Number.POSITIVE_INFINITY) {
      break;
    }
    if (current === goal) {
      break;
    }

    visited.add(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const alt = best + neighbor.weight;
      if (alt < (distance.get(neighbor.to) ?? Number.POSITIVE_INFINITY)) {
        distance.set(neighbor.to, alt);
        previous.set(neighbor.to, current);
      }
    }
  }

  if ((distance.get(goal) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) {
    return null;
  }

  const path: string[] = [];
  let cursor: string | null = goal;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return {
    path,
    weight: distance.get(goal) ?? Number.POSITIVE_INFINITY,
  };
}

function directedAdjacency(graph: ComponentGraph) {
  const normalized = normalizeGraph(graph);
  const adjacency = new Map<string, string[]>();
  for (const node of normalized.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of normalized.edges) {
    adjacency.get(edge.from)?.push(edge.to);
    if (edge.bidirectional) {
      adjacency.get(edge.to)?.push(edge.from);
    }
  }
  return adjacency;
}

export function hasCycle(graph: ComponentGraph) {
  const adjacency = directedAdjacency(graph);
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (id: string): boolean => {
    if (visiting.has(id)) {
      return true;
    }
    if (visited.has(id)) {
      return false;
    }

    visiting.add(id);
    for (const neighbor of adjacency.get(id) ?? []) {
      if (dfs(neighbor)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const id of adjacency.keys()) {
    if (dfs(id)) {
      return true;
    }
  }

  return false;
}

export function topologicalLayers(graph: ComponentGraph) {
  const normalized = normalizeGraph(graph);
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of normalized.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of normalized.edges) {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    if (edge.bidirectional) {
      outgoing.get(edge.to)?.push(edge.from);
      incoming.set(edge.from, (incoming.get(edge.from) ?? 0) + 1);
    }
  }

  const queue = Array.from(incoming.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);

  const layerByNode = new Map<string, number>();
  for (const id of queue) {
    layerByNode.set(id, 0);
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visitedCount += 1;
    const currentLayer = layerByNode.get(current) ?? 0;

    for (const next of outgoing.get(current) ?? []) {
      incoming.set(next, (incoming.get(next) ?? 0) - 1);
      layerByNode.set(next, Math.max(layerByNode.get(next) ?? 0, currentLayer + 1));
      if (incoming.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  if (visitedCount !== normalized.nodes.length) {
    return null;
  }

  const layers = new Map<number, string[]>();
  for (const [id, layer] of layerByNode.entries()) {
    const entries = layers.get(layer);
    if (entries) {
      entries.push(id);
    } else {
      layers.set(layer, [id]);
    }
  }

  return Array.from(layers.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, ids]) => ids);
}

function ccw(a: GraphNode, b: GraphNode, c: GraphNode) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function intersects(a: GraphNode, b: GraphNode, c: GraphNode, d: GraphNode) {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

export function edgeCrossings(graph: ComponentGraph): EdgeCrossing[] {
  const normalized = normalizeGraph(graph);
  const nodes = nodeMap(normalized.nodes);
  const result: EdgeCrossing[] = [];

  for (let i = 0; i < normalized.edges.length; i += 1) {
    for (let j = i + 1; j < normalized.edges.length; j += 1) {
      const first = normalized.edges[i]!;
      const second = normalized.edges[j]!;

      if (
        first.from === second.from ||
        first.from === second.to ||
        first.to === second.from ||
        first.to === second.to
      ) {
        continue;
      }

      const a = nodes.get(first.from);
      const b = nodes.get(first.to);
      const c = nodes.get(second.from);
      const d = nodes.get(second.to);
      if (!a || !b || !c || !d) {
        continue;
      }

      if (intersects(a, b, c, d)) {
        result.push({ a: first.id, b: second.id });
      }
    }
  }

  return result;
}

export function graphDensity(graph: ComponentGraph) {
  const normalized = normalizeGraph(graph);
  const nodeCount = normalized.nodes.length;
  if (nodeCount <= 1) {
    return 0;
  }
  const maxEdges = nodeCount * (nodeCount - 1);
  return normalized.edges.length / maxEdges;
}
