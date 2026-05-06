import type { UnitSystem } from "./pcb-types";

export function formatDistance(mm: number, unit: UnitSystem) {
  if (unit === "mil") {
    return `${(mm * 39.3701).toFixed(1)} mil`;
  }
  return `${mm.toFixed(2)} mm`;
}

export function formatCoordinate(value: number, unit: UnitSystem) {
  return formatDistance(value, unit).replace(" ", "");
}
