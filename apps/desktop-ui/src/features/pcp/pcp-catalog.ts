export type Lifecycle = "active" | "nrnd" | "obsolete";

export type Compliance = "rohs" | "reach" | "mixed";

export type IndustrialCatalogEntry = {
  id: string;
  family: string;
  packageCode: string;
  dielectric: string;
  stackupProfile: string;
  nominalValue: number;
  tolerancePct: number;
  voltageClass: number;
  currentClass: number;
  thermalClass: number;
  lifecycle: Lifecycle;
  compliance: Compliance;
  source: string;
  notes: string;
};

export type CatalogQuery = {
  text?: string;
  family?: string;
  lifecycle?: Lifecycle;
  compliance?: Compliance;
  limit?: number;
};

const DIELECTRICS = ["C0G", "X7R", "NP0", "FR4", "PTFE"] as const;
const TOLERANCES = [1, 2, 5, 10, 20] as const;
const VOLTAGES = [5, 12, 24, 48, 100, 250] as const;
const CURRENTS = [1, 2, 3, 5, 8, 13, 21] as const;
const THERMALS = [35, 50, 65, 85, 105, 125] as const;
const LIFECYCLES: Lifecycle[] = ["active", "nrnd", "obsolete"];
const COMPLIANCES: Compliance[] = ["rohs", "reach", "mixed"];

function deterministic(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value;
  };
}

export function createIndustrialCatalog(size = 1800, seed = 1): IndustrialCatalogEntry[] {
  const next = deterministic(seed);
  return Array.from({ length: Math.max(0, Math.round(size)) }, (_, index) => {
    const value = next();
    return {
      id: `ICP-${index.toString().padStart(6, "0")}`,
      family: `family_${(value % 64).toString().padStart(2, "0")}`,
      packageCode: `PKG-${(value % 512).toString().padStart(3, "0")}`,
      dielectric: DIELECTRICS[value % DIELECTRICS.length],
      stackupProfile: `stack_${(value % 32).toString().padStart(2, "0")}`,
      nominalValue: (value % 10000) + 1,
      tolerancePct: TOLERANCES[value % TOLERANCES.length],
      voltageClass: VOLTAGES[value % VOLTAGES.length],
      currentClass: CURRENTS[value % CURRENTS.length],
      thermalClass: THERMALS[value % THERMALS.length],
      lifecycle: LIFECYCLES[value % LIFECYCLES.length],
      compliance: COMPLIANCES[value % COMPLIANCES.length],
      source: "catalog-core",
      notes: `Industrial profile ${index.toString().padStart(6, "0")}`,
    };
  });
}

export function queryIndustrialCatalog(
  entries: IndustrialCatalogEntry[],
  query: CatalogQuery,
): IndustrialCatalogEntry[] {
  const text = query.text?.trim().toLowerCase() ?? "";
  const limit = Math.max(1, Math.min(2000, Math.round(query.limit ?? 50)));

  return entries
    .filter((entry) => (query.family ? entry.family === query.family : true))
    .filter((entry) => (query.lifecycle ? entry.lifecycle === query.lifecycle : true))
    .filter((entry) => (query.compliance ? entry.compliance === query.compliance : true))
    .filter((entry) => {
      if (!text) {
        return true;
      }
      return (
        entry.id.toLowerCase().includes(text) ||
        entry.family.toLowerCase().includes(text) ||
        entry.packageCode.toLowerCase().includes(text) ||
        entry.dielectric.toLowerCase().includes(text)
      );
    })
    .slice(0, limit);
}

export function summarizeIndustrialCatalog(entries: IndustrialCatalogEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.lifecycle === "active").length,
    nrnd: entries.filter((entry) => entry.lifecycle === "nrnd").length,
    obsolete: entries.filter((entry) => entry.lifecycle === "obsolete").length,
  };
}
