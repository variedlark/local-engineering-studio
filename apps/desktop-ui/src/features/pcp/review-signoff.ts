import type { ArtifactVersion } from "./versioning";

export type ReviewComment = {
  id: string;
  author: string;
  line: string;
  message: string;
  createdAt: number;
  resolved: boolean;
};

export type SignoffGate = "design" | "drc" | "simulation" | "manufacturing";

export type SignoffRecord = {
  id: string;
  versionId: string;
  reviewer: string;
  gate: SignoffGate;
  approved: boolean;
  note: string;
  createdAt: number;
};

export type ReviewWorkspace<TPayload = unknown> = {
  version: ArtifactVersion<TPayload>;
  comments: ReviewComment[];
  signoffs: SignoffRecord[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createReviewWorkspace<TPayload>(version: ArtifactVersion<TPayload>): ReviewWorkspace<TPayload> {
  return {
    version,
    comments: [],
    signoffs: [],
  };
}

export function addReviewComment<TPayload>(
  workspace: ReviewWorkspace<TPayload>,
  input: {
    author: string;
    line: string;
    message: string;
  },
): ReviewWorkspace<TPayload> {
  return {
    ...workspace,
    comments: [
      ...workspace.comments,
      {
        id: uid("comment"),
        author: input.author,
        line: input.line,
        message: input.message,
        createdAt: Date.now(),
        resolved: false,
      },
    ],
  };
}

export function resolveReviewComment<TPayload>(
  workspace: ReviewWorkspace<TPayload>,
  commentId: string,
): ReviewWorkspace<TPayload> {
  return {
    ...workspace,
    comments: workspace.comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            resolved: true,
          }
        : comment,
    ),
  };
}

export function addSignoff<TPayload>(
  workspace: ReviewWorkspace<TPayload>,
  input: {
    reviewer: string;
    gate: SignoffGate;
    approved: boolean;
    note?: string;
  },
): ReviewWorkspace<TPayload> {
  const existing = workspace.signoffs.find(
    (signoff) => signoff.gate === input.gate && signoff.reviewer === input.reviewer,
  );
  const nextRecord: SignoffRecord = {
    id: existing?.id ?? uid("signoff"),
    versionId: workspace.version.id,
    reviewer: input.reviewer,
    gate: input.gate,
    approved: input.approved,
    note: input.note ?? "",
    createdAt: Date.now(),
  };

  return {
    ...workspace,
    signoffs: existing
      ? workspace.signoffs.map((signoff) => (signoff.id === existing.id ? nextRecord : signoff))
      : [...workspace.signoffs, nextRecord],
  };
}

export function unresolvedComments<TPayload>(workspace: ReviewWorkspace<TPayload>) {
  return workspace.comments.filter((comment) => !comment.resolved);
}

export function signoffStatus<TPayload>(workspace: ReviewWorkspace<TPayload>) {
  const gates: SignoffGate[] = ["design", "drc", "simulation", "manufacturing"];
  const byGate = gates.map((gate) => {
    const records = workspace.signoffs.filter((signoff) => signoff.gate === gate);
    const approved = records.some((record) => record.approved);
    return {
      gate,
      approved,
      records,
    };
  });
  const allApproved = byGate.every((entry) => entry.approved);
  return {
    allApproved,
    gates: byGate,
  };
}

export function canRelease<TPayload>(workspace: ReviewWorkspace<TPayload>) {
  const comments = unresolvedComments(workspace);
  const signoff = signoffStatus(workspace);
  return {
    releasable: comments.length === 0 && signoff.allApproved,
    unresolvedCommentCount: comments.length,
    signoff,
  };
}

export function summarizeReview<TPayload>(workspace: ReviewWorkspace<TPayload>) {
  const release = canRelease(workspace);
  return {
    versionId: workspace.version.id,
    comments: workspace.comments.length,
    unresolved: release.unresolvedCommentCount,
    signoffApproved: release.signoff.allApproved,
    releasable: release.releasable,
  };
}
