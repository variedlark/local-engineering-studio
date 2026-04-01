import { describe, expect, it } from "vitest";
import { detectImportSource, importBySource } from "./importers";

const sample = JSON.stringify({
  width: 6000,
  height: 4000,
  components: [{ ref: "U1", x: 100, y: 200 }],
  tracks: [{ net: "N1", layer: "Top", x1: 100, y1: 200, x2: 200, y2: 200, width: 80 }],
  vias: [{ net: "N1", x: 200, y: 200, drill: 200, diameter: 400 }],
});

describe("importers", () => {
  it("detects source and imports board", () => {
    const source = detectImportSource("project-kicad.json");
    expect(source).toBe("kicad");

    const result = importBySource(source, sample);
    expect(result.board.components.length).toBe(1);
    expect(result.board.tracks.length).toBe(1);
  });
});
