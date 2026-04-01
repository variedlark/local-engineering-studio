export function sanitizePositiveInt(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
}

export function sanitizeNonNegativeFloat(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
}

export function sanitizePositiveFloat(value: number, fallback: number, minimum: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(minimum, value);
}
