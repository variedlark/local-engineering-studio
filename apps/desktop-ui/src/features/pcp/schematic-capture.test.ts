import { describe, expect, it } from "vitest";
import {
  addSymbol,
  connectPins,
  createSheet,
  generateNetlist,
  summarizeSchematic,
  validateSchematic,
} from "./schematic-capture";

describe("schematic-capture", () => {
  it("builds a minimal schematic and netlist", () => {
    const base = createSheet("Main");
    const withR = addSymbol(base, {
      ref: "R1",
      libId: "resistor",
      x: 0,
      y: 0,
      rotation: 0,
      pins: [
        { id: "1", name: "1", x: -10, y: 0, direction: "bidirectional" },
        { id: "2", name: "2", x: 10, y: 0, direction: "bidirectional" },
      ],
      properties: {},
    });
    const withU = addSymbol(withR, {
      ref: "U1",
      libId: "opamp",
      x: 60,
      y: 0,
      rotation: 0,
      pins: [{ id: "IN", name: "IN", x: -10, y: 0, direction: "input" }],
      properties: {},
    });
    const r = withU.symbols.find((symbol) => symbol.ref === "R1")!;
    const u = withU.symbols.find((symbol) => symbol.ref === "U1")!;
    const connected = connectPins(
      withU,
      "NET_SIG",
      { symbolId: r.id, pinId: "2" },
      { symbolId: u.id, pinId: "IN" },
    );

    const netlist = generateNetlist(connected);
    expect(netlist).toHaveLength(1);
    expect(netlist[0]?.nodes.length).toBe(2);

    const summary = summarizeSchematic(connected);
    expect(summary.symbolCount).toBe(2);
    expect(summary.netCount).toBe(1);
  });

  it("validates schematic integrity", () => {
    const sheet = createSheet("Check");
    const validation = validateSchematic(sheet);
    expect(validation.valid).toBe(true);
  });
});
