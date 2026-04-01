import type { BoardModel } from "./board-kernel";

export type ManufacturingExport = {
  format: "gerber" | "excellon" | "odbpp" | "ipc2581" | "bom" | "pick_place";
  fileName: string;
  content: string;
};

function header(board: BoardModel, label: string) {
  return `# ${label}\n# board ${board.width}x${board.height}\n# layers ${board.layers.length}\n`;
}

function csvRow(values: Array<string | number>) {
  return `${values.map((value) => `${value}`).join(",")}\n`;
}

export function exportGerber(board: BoardModel): ManufacturingExport[] {
  return board.layers.map((layer) => ({
    format: "gerber",
    fileName: `${layer.name.toLowerCase().replace(/\s+/g, "_")}.gbr`,
    content:
      header(board, `Gerber ${layer.name}`) +
      board.tracks
        .filter((track) => track.layerId === layer.id)
        .map((track) => `X${track.from.x}Y${track.from.y}D02*\nX${track.to.x}Y${track.to.y}D01*\n`)
        .join(""),
  }));
}

export function exportExcellon(board: BoardModel): ManufacturingExport {
  return {
    format: "excellon",
    fileName: "drill.drl",
    content:
      header(board, "Excellon Drill") +
      board.vias.map((via) => `T01\nX${via.x}Y${via.y}\n`).join(""),
  };
}

export function exportOdbpp(board: BoardModel): ManufacturingExport {
  return {
    format: "odbpp",
    fileName: "job.odbpp",
    content:
      header(board, "ODB++") +
      `COMPONENTS ${board.components.length}\nTRACKS ${board.tracks.length}\nVIAS ${board.vias.length}\n`,
  };
}

export function exportIpc2581(board: BoardModel): ManufacturingExport {
  const componentRows = board.components
    .map((component) => `<Component ref="${component.ref}" x="${component.x}" y="${component.y}"/>`)
    .join("\n");
  return {
    format: "ipc2581",
    fileName: "layout.ipc2581.xml",
    content:
      `<IPC2581 width="${board.width}" height="${board.height}">\n` +
      `<Layers count="${board.layers.length}"/>\n` +
      `<Components>\n${componentRows}\n</Components>\n` +
      `</IPC2581>\n`,
  };
}

export function exportBom(board: BoardModel): ManufacturingExport {
  const rows = [csvRow(["Ref", "X", "Y", "Side"])];
  for (const component of board.components) {
    rows.push(csvRow([component.ref, component.x, component.y, component.side]));
  }
  return {
    format: "bom",
    fileName: "bom.csv",
    content: rows.join(""),
  };
}

export function exportPickPlace(board: BoardModel): ManufacturingExport {
  const rows = [csvRow(["Ref", "PosX", "PosY", "Rot", "Side"])];
  for (const component of board.components) {
    rows.push(csvRow([component.ref, component.x, component.y, component.rotation, component.side]));
  }
  return {
    format: "pick_place",
    fileName: "pick_place.csv",
    content: rows.join(""),
  };
}

export function exportManufacturingPackage(board: BoardModel) {
  return [
    ...exportGerber(board),
    exportExcellon(board),
    exportOdbpp(board),
    exportIpc2581(board),
    exportBom(board),
    exportPickPlace(board),
  ];
}
