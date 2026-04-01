import type { ActivityEvent, ActivityKind, ActivityStatus } from "./ui-store.types";

function activityId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function prependActivity(
  events: ActivityEvent[],
  kind: ActivityKind,
  status: ActivityStatus,
  title: string,
  detail: string,
) {
  const next: ActivityEvent = {
    id: activityId(),
    at: Date.now(),
    kind,
    status,
    title,
    detail,
  };
  return [next, ...events].slice(0, 240);
}

export function prependLog(logs: string[], message: string) {
  return [`[${new Date().toLocaleTimeString()}] ${message}`, ...logs].slice(0, 120);
}
