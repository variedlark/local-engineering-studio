export type BuildTarget = "macos" | "windows" | "linux";

export type BuildArtifact = {
  target: BuildTarget;
  fileName: string;
  sizeMb: number;
  signed: boolean;
  notarized: boolean;
};

export type BenchmarkResult = {
  name: string;
  durationMs: number;
  passed: boolean;
};

export type ReleasePlan = {
  version: string;
  artifacts: BuildArtifact[];
  benchmarks: BenchmarkResult[];
  checksums: Record<string, string>;
};

function hash(text: string) {
  let value = 7;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) | 0;
  }
  return `sha-${Math.abs(value).toString(16)}`;
}

export function planRelease(version: string): ReleasePlan {
  const artifacts: BuildArtifact[] = [
    {
      target: "macos",
      fileName: `les-${version}-macos.dmg`,
      sizeMb: 180,
      signed: true,
      notarized: true,
    },
    {
      target: "windows",
      fileName: `les-${version}-windows.msi`,
      sizeMb: 195,
      signed: true,
      notarized: false,
    },
    {
      target: "linux",
      fileName: `les-${version}-linux.AppImage`,
      sizeMb: 170,
      signed: true,
      notarized: false,
    },
  ];

  const benchmarks: BenchmarkResult[] = [
    { name: "startup", durationMs: 420, passed: true },
    { name: "route_100_nets", durationMs: 860, passed: true },
    { name: "drc_50k_segments", durationMs: 1270, passed: true },
  ];

  const checksums = Object.fromEntries(
    artifacts.map((artifact) => [artifact.fileName, hash(`${artifact.fileName}:${artifact.sizeMb}`)]),
  );

  return {
    version,
    artifacts,
    benchmarks,
    checksums,
  };
}

export function validateReleasePlan(plan: ReleasePlan) {
  const issues: string[] = [];
  if (!plan.version.trim()) {
    issues.push("Missing version");
  }
  for (const artifact of plan.artifacts) {
    if (!artifact.signed) {
      issues.push(`${artifact.fileName} is not signed`);
    }
    if (artifact.sizeMb <= 0) {
      issues.push(`${artifact.fileName} has invalid size`);
    }
  }
  for (const benchmark of plan.benchmarks) {
    if (!benchmark.passed) {
      issues.push(`Benchmark failed: ${benchmark.name}`);
    }
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function summarizeReleasePlan(plan: ReleasePlan) {
  const benchmarkPassRate =
    plan.benchmarks.length === 0
      ? 0
      : Math.round(
          (plan.benchmarks.filter((benchmark) => benchmark.passed).length / plan.benchmarks.length) *
            100,
        );

  return {
    version: plan.version,
    artifactCount: plan.artifacts.length,
    benchmarkPassRate,
  };
}
