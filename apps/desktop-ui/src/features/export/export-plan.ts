import type { ActivityEvent, HealthReport } from "../ui-store.types";

export type ExportPackageInput = {
  projectName: string;
  revision: number;
  qualityScore: number | null;
  qualitySummary: string;
  healthReport: HealthReport | null;
  notes: Array<{ id: string; text: string; pinned: boolean; createdAt: number }>;
  activityEvents: ActivityEvent[];
  generatedAt?: number;
};

export type ExportPackage = {
  manifest: {
    projectName: string;
    revision: number;
    generatedAt: number;
    qualityScore: number | null;
    qualitySummary: string;
  };
  notes: Array<{ id: string; text: string; pinned: boolean; createdAt: number }>;
  activity: Array<{ id: string; at: number; kind: string; status: string; title: string; detail: string }>;
  report: {
    summary: string;
    details: string[];
  };
};

function normalizeNotes(input: ExportPackageInput["notes"]) {
  const sorted = [...input].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });
  return sorted.map((note) => ({
    id: note.id,
    text: note.text,
    pinned: note.pinned,
    createdAt: note.createdAt,
  }));
}

function normalizeActivity(events: ActivityEvent[]) {
  return [...events]
    .sort((a, b) => b.at - a.at)
    .slice(0, 200)
    .map((event) => ({
      id: event.id,
      at: event.at,
      kind: event.kind,
      status: event.status,
      title: event.title,
      detail: event.detail,
    }));
}

function buildReport(input: ExportPackageInput) {
  const details = [
    `Project: ${input.projectName}`,
    `Revision: ${input.revision}`,
    `Quality: ${input.qualityScore === null ? "pending" : `${input.qualityScore}/100`}`,
    `Notes: ${input.notes.length}`,
    `Activity events: ${input.activityEvents.length}`,
  ];

  if (input.healthReport) {
    details.push(...input.healthReport.details.slice(0, 8));
  }

  return {
    summary: input.healthReport?.summary ?? "No health report generated",
    details,
  };
}

export function buildExportPackage(input: ExportPackageInput): ExportPackage {
  const generatedAt = input.generatedAt ?? Date.now();
  return {
    manifest: {
      projectName: input.projectName,
      revision: input.revision,
      generatedAt,
      qualityScore: input.qualityScore,
      qualitySummary: input.qualitySummary,
    },
    notes: normalizeNotes(input.notes),
    activity: normalizeActivity(input.activityEvents),
    report: buildReport(input),
  };
}

export function serializeExportPackage(pkg: ExportPackage) {
  return JSON.stringify(pkg, null, 2);
}

export function exportPackageSizeBytes(pkg: ExportPackage) {
  return new TextEncoder().encode(serializeExportPackage(pkg)).byteLength;
}

export function summarizeExportPackage(pkg: ExportPackage) {
  return `Export ${pkg.manifest.projectName}@r${pkg.manifest.revision} with ${pkg.notes.length} notes and ${pkg.activity.length} activity entries`;
}
