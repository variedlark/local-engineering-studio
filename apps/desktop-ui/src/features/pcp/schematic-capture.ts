export type PinDirection = "input" | "output" | "bidirectional" | "power";

export type SymbolPin = {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: PinDirection;
};

export type SchematicSymbol = {
  id: string;
  ref: string;
  libId: string;
  x: number;
  y: number;
  rotation: number;
  pins: SymbolPin[];
  properties: Record<string, string>;
};

export type NetConnection = {
  symbolId: string;
  pinId: string;
};

export type SchematicNet = {
  id: string;
  name: string;
  connections: NetConnection[];
};

export type SchematicSheet = {
  id: string;
  name: string;
  symbols: SchematicSymbol[];
  nets: SchematicNet[];
  annotations: string[];
};

export type NetlistEntry = {
  netName: string;
  nodes: Array<{ ref: string; pin: string }>;
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeRotation(value: number) {
  const rounded = Math.round(value / 90) * 90;
  const normalized = rounded % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function hasConnection(net: SchematicNet, connection: NetConnection) {
  return net.connections.some(
    (entry) => entry.symbolId === connection.symbolId && entry.pinId === connection.pinId,
  );
}

function findSymbol(sheet: SchematicSheet, symbolId: string) {
  return sheet.symbols.find((symbol) => symbol.id === symbolId) ?? null;
}

function findPin(symbol: SchematicSymbol, pinId: string) {
  return symbol.pins.find((pin) => pin.id === pinId) ?? null;
}

export function createSheet(name: string): SchematicSheet {
  return {
    id: makeId("sheet"),
    name: name.trim() || "Untitled Sheet",
    symbols: [],
    nets: [],
    annotations: [],
  };
}

export function addSymbol(sheet: SchematicSheet, symbol: Omit<SchematicSymbol, "id">): SchematicSheet {
  const ref = symbol.ref.trim();
  if (!ref) {
    throw new Error("Symbol reference cannot be empty");
  }
  if (sheet.symbols.some((entry) => entry.ref === ref)) {
    throw new Error(`Duplicate symbol reference: ${ref}`);
  }
  const created: SchematicSymbol = {
    ...symbol,
    id: makeId("sym"),
    ref,
    x: Math.round(symbol.x),
    y: Math.round(symbol.y),
    rotation: normalizeRotation(symbol.rotation),
    pins: symbol.pins.map((pin) => ({ ...pin })),
  };
  return {
    ...sheet,
    symbols: [...sheet.symbols, created],
  };
}

export function moveSymbol(sheet: SchematicSheet, symbolId: string, x: number, y: number): SchematicSheet {
  return {
    ...sheet,
    symbols: sheet.symbols.map((symbol) =>
      symbol.id === symbolId
        ? {
            ...symbol,
            x: Math.round(x),
            y: Math.round(y),
          }
        : symbol,
    ),
  };
}

export function rotateSymbol(sheet: SchematicSheet, symbolId: string, rotation: number): SchematicSheet {
  return {
    ...sheet,
    symbols: sheet.symbols.map((symbol) =>
      symbol.id === symbolId
        ? {
            ...symbol,
            rotation: normalizeRotation(rotation),
          }
        : symbol,
    ),
  };
}

export function connectPins(
  sheet: SchematicSheet,
  netName: string,
  first: NetConnection,
  second: NetConnection,
): SchematicSheet {
  const symbolA = findSymbol(sheet, first.symbolId);
  const symbolB = findSymbol(sheet, second.symbolId);
  if (!symbolA || !symbolB) {
    throw new Error("Connection references unknown symbol");
  }
  if (!findPin(symbolA, first.pinId) || !findPin(symbolB, second.pinId)) {
    throw new Error("Connection references unknown pin");
  }

  const normalizedNetName = netName.trim() || "N$AUTO";
  const existingNet =
    sheet.nets.find((net) => net.name.toLowerCase() === normalizedNetName.toLowerCase()) ?? null;

  if (!existingNet) {
    return {
      ...sheet,
      nets: [
        ...sheet.nets,
        {
          id: makeId("net"),
          name: normalizedNetName,
          connections: [first, second],
        },
      ],
    };
  }

  const nextConnections = [...existingNet.connections];
  if (!hasConnection(existingNet, first)) {
    nextConnections.push(first);
  }
  if (!hasConnection(existingNet, second)) {
    nextConnections.push(second);
  }

  return {
    ...sheet,
    nets: sheet.nets.map((net) =>
      net.id === existingNet.id
        ? {
            ...net,
            connections: nextConnections,
          }
        : net,
    ),
  };
}

export function generateNetlist(sheet: SchematicSheet): NetlistEntry[] {
  return sheet.nets.map((net) => ({
    netName: net.name,
    nodes: net.connections
      .map((connection) => {
        const symbol = findSymbol(sheet, connection.symbolId);
        if (!symbol) {
          return null;
        }
        const pin = findPin(symbol, connection.pinId);
        if (!pin) {
          return null;
        }
        return {
          ref: symbol.ref,
          pin: pin.name,
        };
      })
      .filter((entry): entry is { ref: string; pin: string } => entry !== null),
  }));
}

export function validateSchematic(sheet: SchematicSheet) {
  const errors: string[] = [];
  const refs = new Set<string>();

  for (const symbol of sheet.symbols) {
    if (refs.has(symbol.ref)) {
      errors.push(`Duplicate symbol ref ${symbol.ref}`);
    }
    refs.add(symbol.ref);
    if (symbol.pins.length === 0) {
      errors.push(`Symbol ${symbol.ref} has no pins`);
    }
  }

  for (const net of sheet.nets) {
    if (net.connections.length < 2) {
      errors.push(`Net ${net.name} has fewer than two connections`);
    }
    for (const connection of net.connections) {
      const symbol = findSymbol(sheet, connection.symbolId);
      if (!symbol) {
        errors.push(`Net ${net.name} references missing symbol`);
        continue;
      }
      if (!findPin(symbol, connection.pinId)) {
        errors.push(`Net ${net.name} references missing pin on ${symbol.ref}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function summarizeSchematic(sheet: SchematicSheet) {
  const netlist = generateNetlist(sheet);
  return {
    symbolCount: sheet.symbols.length,
    netCount: sheet.nets.length,
    nodeCount: netlist.reduce((sum, net) => sum + net.nodes.length, 0),
  };
}
