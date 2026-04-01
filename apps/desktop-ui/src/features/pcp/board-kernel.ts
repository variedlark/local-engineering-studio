export type Point = { x: number; y: number };

export type LayerKind = "signal" | "power" | "ground" | "mechanical";

export type BoardLayer = {
  id: string;
  name: string;
  kind: LayerKind;
  order: number;
};

export type BoardComponent = {
  id: string;
  ref: string;
  x: number;
  y: number;
  rotation: number;
  side: "top" | "bottom";
};

export type TrackSegment = {
  id: string;
  net: string;
  layerId: string;
  from: Point;
  to: Point;
  width: number;
};

export type Via = {
  id: string;
  net: string;
  x: number;
  y: number;
  drill: number;
  diameter: number;
  startLayer: string;
  endLayer: string;
};

export type CopperZone = {
  id: string;
  net: string;
  layerId: string;
  polygon: Point[];
  clearance: number;
};

export type BoardModel = {
  width: number;
  height: number;
  layers: BoardLayer[];
  components: BoardComponent[];
  tracks: TrackSegment[];
  vias: Via[];
  zones: CopperZone[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function roundPoint(point: Point): Point {
  return { x: Math.round(point.x), y: Math.round(point.y) };
}

function normalizeRotation(rotation: number) {
  const rounded = Math.round(rotation / 90) * 90;
  const normalized = rounded % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function polygonArea(points: Point[]) {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area / 2);
}

function segmentLength(segment: TrackSegment) {
  return Math.abs(segment.to.x - segment.from.x) + Math.abs(segment.to.y - segment.from.y);
}

export function createBoard(width: number, height: number): BoardModel {
  return {
    width: Math.max(1000, Math.round(width)),
    height: Math.max(1000, Math.round(height)),
    layers: [
      { id: "L1", name: "Top", kind: "signal", order: 1 },
      { id: "L2", name: "Bottom", kind: "signal", order: 2 },
    ],
    components: [],
    tracks: [],
    vias: [],
    zones: [],
  };
}

export function addLayer(board: BoardModel, layer: Omit<BoardLayer, "id">): BoardModel {
  return {
    ...board,
    layers: [...board.layers, { ...layer, id: uid("layer") }].sort((a, b) => a.order - b.order),
  };
}

export function placeComponent(
  board: BoardModel,
  component: Omit<BoardComponent, "id" | "rotation"> & { rotation?: number },
): BoardModel {
  if (board.components.some((entry) => entry.ref === component.ref)) {
    throw new Error(`Duplicate component ref ${component.ref}`);
  }
  return {
    ...board,
    components: [
      ...board.components,
      {
        ...component,
        id: uid("cmp"),
        x: Math.round(component.x),
        y: Math.round(component.y),
        rotation: normalizeRotation(component.rotation ?? 0),
      },
    ],
  };
}

export function moveComponent(board: BoardModel, componentId: string, x: number, y: number): BoardModel {
  return {
    ...board,
    components: board.components.map((component) =>
      component.id === componentId
        ? {
            ...component,
            x: Math.round(x),
            y: Math.round(y),
          }
        : component,
    ),
  };
}

export function addTrack(
  board: BoardModel,
  track: Omit<TrackSegment, "id" | "from" | "to"> & { from: Point; to: Point },
): BoardModel {
  if (!board.layers.some((layer) => layer.id === track.layerId)) {
    throw new Error(`Unknown layer ${track.layerId}`);
  }
  return {
    ...board,
    tracks: [
      ...board.tracks,
      {
        ...track,
        id: uid("trk"),
        from: roundPoint(track.from),
        to: roundPoint(track.to),
        width: Math.max(1, Math.round(track.width)),
      },
    ],
  };
}

export function addVia(board: BoardModel, via: Omit<Via, "id">): BoardModel {
  if (!board.layers.some((layer) => layer.id === via.startLayer)) {
    throw new Error(`Unknown start layer ${via.startLayer}`);
  }
  if (!board.layers.some((layer) => layer.id === via.endLayer)) {
    throw new Error(`Unknown end layer ${via.endLayer}`);
  }
  return {
    ...board,
    vias: [
      ...board.vias,
      {
        ...via,
        id: uid("via"),
        x: Math.round(via.x),
        y: Math.round(via.y),
        drill: Math.max(1, Math.round(via.drill)),
        diameter: Math.max(1, Math.round(via.diameter)),
      },
    ],
  };
}

export function addZone(
  board: BoardModel,
  zone: Omit<CopperZone, "id" | "polygon"> & { polygon: Point[] },
): BoardModel {
  if (!board.layers.some((layer) => layer.id === zone.layerId)) {
    throw new Error(`Unknown layer ${zone.layerId}`);
  }
  if (zone.polygon.length < 3) {
    throw new Error("Zone polygon must have at least 3 points");
  }
  return {
    ...board,
    zones: [
      ...board.zones,
      {
        ...zone,
        id: uid("zone"),
        polygon: zone.polygon.map(roundPoint),
        clearance: Math.max(1, Math.round(zone.clearance)),
      },
    ],
  };
}

export function boardBoundingBox(board: BoardModel) {
  const points: Point[] = [];
  for (const component of board.components) {
    points.push({ x: component.x, y: component.y });
  }
  for (const track of board.tracks) {
    points.push(track.from, track.to);
  }
  for (const via of board.vias) {
    points.push({ x: via.x, y: via.y });
  }
  for (const zone of board.zones) {
    points.push(...zone.polygon);
  }
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: board.width, maxY: board.height };
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function boardStats(board: BoardModel) {
  return {
    layerCount: board.layers.length,
    componentCount: board.components.length,
    trackCount: board.tracks.length,
    viaCount: board.vias.length,
    zoneCount: board.zones.length,
    totalTrackLength: board.tracks.reduce((sum, track) => sum + segmentLength(track), 0),
    totalZoneArea: board.zones.reduce((sum, zone) => sum + polygonArea(zone.polygon), 0),
  };
}

export function validateBoard(board: BoardModel) {
  const issues: string[] = [];
  const refs = new Set<string>();
  const layers = new Set(board.layers.map((layer) => layer.id));

  for (const component of board.components) {
    if (refs.has(component.ref)) {
      issues.push(`Duplicate component ref ${component.ref}`);
    }
    refs.add(component.ref);
    if (component.x < 0 || component.y < 0 || component.x > board.width || component.y > board.height) {
      issues.push(`Component ${component.ref} outside board bounds`);
    }
  }

  for (const track of board.tracks) {
    if (!layers.has(track.layerId)) {
      issues.push(`Track ${track.id} references missing layer ${track.layerId}`);
    }
    if (track.width <= 0) {
      issues.push(`Track ${track.id} has non-positive width`);
    }
  }

  for (const via of board.vias) {
    if (!layers.has(via.startLayer) || !layers.has(via.endLayer)) {
      issues.push(`Via ${via.id} references invalid layer span`);
    }
    if (via.diameter < via.drill) {
      issues.push(`Via ${via.id} diameter smaller than drill`);
    }
  }

  for (const zone of board.zones) {
    if (!layers.has(zone.layerId)) {
      issues.push(`Zone ${zone.id} references missing layer`);
    }
    if (zone.polygon.length < 3) {
      issues.push(`Zone ${zone.id} has invalid polygon`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
