export type RoadmapTrack = {
  id: string;
  name: string;
  currentLoc: number;
  targetLoc: number;
  milestones: Array<{
    id: string;
    title: string;
    owner: string;
    etaWeeks: number;
    locDelta: number;
    dependencies: string[];
  }>;
};

export type RoadmapProjection = {
  totalCurrentLoc: number;
  totalProjectedLoc: number;
  progressPct: number;
  totalWeeks: number;
};

export function createRoadmapTrack(input: Omit<RoadmapTrack, "id">): RoadmapTrack {
  return {
    ...input,
    id: `track-${Math.random().toString(16).slice(2, 8)}`,
  };
}

export function roadmapProjection(tracks: RoadmapTrack[]): RoadmapProjection {
  const totalCurrentLoc = tracks.reduce((sum, track) => sum + track.currentLoc, 0);
  const totalProjectedLoc = tracks.reduce(
    (sum, track) =>
      sum +
      Math.max(
        track.currentLoc,
        track.currentLoc + track.milestones.reduce((milestoneSum, milestone) => milestoneSum + milestone.locDelta, 0),
      ),
    0,
  );
  const totalTarget = tracks.reduce((sum, track) => sum + track.targetLoc, 0);
  const progressPct = totalTarget === 0 ? 0 : Math.round((totalProjectedLoc / totalTarget) * 10000) / 100;
  const totalWeeks = tracks.reduce(
    (sum, track) => sum + Math.max(0, ...track.milestones.map((milestone) => milestone.etaWeeks)),
    0,
  );

  return {
    totalCurrentLoc,
    totalProjectedLoc,
    progressPct,
    totalWeeks,
  };
}

export function criticalPath(tracks: RoadmapTrack[]) {
  const milestones = tracks.flatMap((track) => track.milestones.map((milestone) => ({ track: track.name, ...milestone })));
  return milestones
    .sort((a, b) => b.etaWeeks - a.etaWeeks)
    .slice(0, 10)
    .map((milestone) => ({
      track: milestone.track,
      title: milestone.title,
      etaWeeks: milestone.etaWeeks,
      locDelta: milestone.locDelta,
    }));
}

export function roadmapRisks(tracks: RoadmapTrack[]) {
  const risks: Array<{ track: string; risk: string }> = [];
  for (const track of tracks) {
    const projected = track.currentLoc + track.milestones.reduce((sum, milestone) => sum + milestone.locDelta, 0);
    if (projected < track.targetLoc) {
      risks.push({
        track: track.name,
        risk: `Projected LOC ${projected} below target ${track.targetLoc}`,
      });
    }
    if (track.milestones.some((milestone) => milestone.dependencies.length > 3)) {
      risks.push({
        track: track.name,
        risk: "Milestones with heavy dependency fan-in",
      });
    }
  }
  return risks;
}
