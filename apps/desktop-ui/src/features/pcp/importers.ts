import type { BoardModel } from "./board-kernel";
import { createBoard, placeComponent, addTrack, addVia } from "./board-kernel";

export type ImportSource = "kicad" | "altium" | "eagle";

export type ImportParseResult = {
  source: ImportSource;
  board: BoardModel;
  warnings: string[];
};

type GenericImportComponent = {
  ref: string;
  x: number;
  y: number;
  side?: "top" | "bottom";
};

type GenericImportTrack = {
  net: string;
  layer: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
};

type GenericImportVia = {
  net: string;
  x: number;
  y: number;
  drill: number;
  diameter: number;
};

type GenericBoard = {
  width: number;
  height: number;
  components: GenericImportComponent[];
  tracks: GenericImportTrack[];
  vias: GenericImportVia[];
};

function parseJson(text: string) {
  return JSON.parse(text) as Partial<GenericBoard>;
}

function toBoardModel(parsed: Partial<GenericBoard>): ImportParseResult["board"] {
  let board = createBoard(parsed.width ?? 5000, parsed.height ?? 5000);

  for (const component of parsed.components ?? []) {
    board = placeComponent(board, {
      ref: component.ref,
      x: component.x,
      y: component.y,
      side: component.side ?? "top",
    });
  }

  for (const track of parsed.tracks ?? []) {
    const layer = board.layers.find((entry) => entry.name.toLowerCase() === track.layer.toLowerCase())?.id ?? "L1";
    board = addTrack(board, {
      net: track.net,
      layerId: layer,
      from: { x: track.x1, y: track.y1 },
      to: { x: track.x2, y: track.y2 },
      width: track.width,
    });
  }

  for (const via of parsed.vias ?? []) {
    board = addVia(board, {
      net: via.net,
      x: via.x,
      y: via.y,
      drill: via.drill,
      diameter: via.diameter,
      startLayer: "L1",
      endLayer: "L2",
    });
  }

  return board;
}

function parseWithSource(source: ImportSource, text: string): ImportParseResult {
  const parsed = parseJson(text);
  const warnings: string[] = [];
  if (!Array.isArray(parsed.components)) {
    warnings.push("No components parsed");
  }
  if (!Array.isArray(parsed.tracks)) {
    warnings.push("No tracks parsed");
  }
  if (!Array.isArray(parsed.vias)) {
    warnings.push("No vias parsed");
  }
  return {
    source,
    board: toBoardModel(parsed),
    warnings,
  };
}

export function importKiCad(text: string): ImportParseResult {
  return parseWithSource("kicad", text);
}

export function importAltium(text: string): ImportParseResult {
  return parseWithSource("altium", text);
}

export function importEagle(text: string): ImportParseResult {
  return parseWithSource("eagle", text);
}

export function detectImportSource(fileName: string): ImportSource {
  const normalized = fileName.trim().toLowerCase();
  if (normalized.includes("kicad")) {
    return "kicad";
  }
  if (normalized.includes("altium")) {
    return "altium";
  }
  return "eagle";
}

export function importBySource(source: ImportSource, text: string): ImportParseResult {
  if (source === "kicad") {
    return importKiCad(text);
  }
  if (source === "altium") {
    return importAltium(text);
  }
  return importEagle(text);
}
