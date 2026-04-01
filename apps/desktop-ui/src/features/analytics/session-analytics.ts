import type { ActivityEvent } from "../ui-store.types";

export type SessionTimelinePoint = {
  t: number;
  totalEvents: number;
  commandEvents: number;
  analysisEvents: number;
  qualityEvents: number;
};

export type SessionKpi = {
  avgEventsPerMinute: number;
  commandToAnalysisRatio: number;
  qualityFrequency: number;
  errorRate: number;
  momentum: "low" | "steady" | "high";
};

function minuteBucket(timestamp: number) {
  return Math.floor(timestamp / 60000);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildSessionTimeline(events: ActivityEvent[]): SessionTimelinePoint[] {
  if (events.length === 0) {
    return [];
  }

  const sorted = [...events].sort((a, b) => a.at - b.at);
  const firstBucket = minuteBucket(sorted[0]!.at);
  const buckets = new Map<number, SessionTimelinePoint>();

  for (const event of sorted) {
    const bucket = minuteBucket(event.at) - firstBucket;
    const current = buckets.get(bucket) ?? {
      t: bucket,
      totalEvents: 0,
      commandEvents: 0,
      analysisEvents: 0,
      qualityEvents: 0,
    };

    current.totalEvents += 1;
    if (event.kind === "command") {
      current.commandEvents += 1;
    }
    if (event.kind === "analysis") {
      current.analysisEvents += 1;
    }
    if (event.kind === "quality") {
      current.qualityEvents += 1;
    }

    buckets.set(bucket, current);
  }

  return Array.from(buckets.values()).sort((a, b) => a.t - b.t);
}

export function computeSessionKpi(events: ActivityEvent[]): SessionKpi {
  if (events.length === 0) {
    return {
      avgEventsPerMinute: 0,
      commandToAnalysisRatio: 0,
      qualityFrequency: 0,
      errorRate: 0,
      momentum: "low",
    };
  }

  const sorted = [...events].sort((a, b) => a.at - b.at);
  const minutes = Math.max(1, Math.ceil((sorted[sorted.length - 1]!.at - sorted[0]!.at) / 60000));

  const commandCount = events.filter((event) => event.kind === "command").length;
  const analysisCount = events.filter((event) => event.kind === "analysis").length;
  const qualityCount = events.filter((event) => event.kind === "quality").length;
  const errorCount = events.filter((event) => event.status === "error").length;

  const avgEventsPerMinute = round2(events.length / minutes);
  const commandToAnalysisRatio = round2(commandCount / Math.max(1, analysisCount));
  const qualityFrequency = round2(qualityCount / Math.max(1, events.length));
  const errorRate = round2(errorCount / Math.max(1, events.length));

  let momentum: SessionKpi["momentum"] = "steady";
  if (avgEventsPerMinute < 0.8) {
    momentum = "low";
  } else if (avgEventsPerMinute > 2.4) {
    momentum = "high";
  }

  return {
    avgEventsPerMinute,
    commandToAnalysisRatio,
    qualityFrequency,
    errorRate,
    momentum,
  };
}

export function projectSessionNarrative(events: ActivityEvent[]) {
  const kpi = computeSessionKpi(events);
  if (events.length === 0) {
    return "No activity captured yet.";
  }
  return `Momentum ${kpi.momentum}; ${kpi.avgEventsPerMinute}/min, ratio C/A ${kpi.commandToAnalysisRatio}, quality frequency ${kpi.qualityFrequency}`;
}

export function detectSessionSpikes(events: ActivityEvent[], threshold = 4) {
  const timeline = buildSessionTimeline(events);
  return timeline.filter((point) => point.totalEvents >= threshold);
}

export function computeCommandPressure(events: ActivityEvent[]) {
  const commands = events.filter((event) => event.kind === "command").length;
  const analysis = events.filter((event) => event.kind === "analysis").length;
  const quality = events.filter((event) => event.kind === "quality").length;
  const denominator = Math.max(1, analysis + quality);
  return round2(commands / denominator);
}
