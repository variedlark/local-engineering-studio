export type SessionUser = {
  id: string;
  name: string;
  role: "owner" | "reviewer" | "observer";
};

export type SessionAnnotation = {
  id: string;
  authorId: string;
  target: string;
  message: string;
  createdAt: number;
  resolved: boolean;
};

export type SessionTask = {
  id: string;
  title: string;
  ownerId: string | null;
  status: "todo" | "doing" | "done";
  createdAt: number;
};

export type CollaborationState = {
  users: SessionUser[];
  annotations: SessionAnnotation[];
  tasks: SessionTask[];
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createCollaborationState(): CollaborationState {
  return {
    users: [],
    annotations: [],
    tasks: [],
  };
}

export function addUser(state: CollaborationState, user: Omit<SessionUser, "id">): CollaborationState {
  return {
    ...state,
    users: [...state.users, { ...user, id: uid("user") }],
  };
}

export function addAnnotation(
  state: CollaborationState,
  input: {
    authorId: string;
    target: string;
    message: string;
  },
): CollaborationState {
  return {
    ...state,
    annotations: [
      ...state.annotations,
      {
        id: uid("ann"),
        authorId: input.authorId,
        target: input.target,
        message: input.message,
        createdAt: Date.now(),
        resolved: false,
      },
    ],
  };
}

export function resolveAnnotation(state: CollaborationState, annotationId: string): CollaborationState {
  return {
    ...state,
    annotations: state.annotations.map((annotation) =>
      annotation.id === annotationId
        ? {
            ...annotation,
            resolved: true,
          }
        : annotation,
    ),
  };
}

export function addTask(state: CollaborationState, title: string, ownerId: string | null): CollaborationState {
  return {
    ...state,
    tasks: [
      ...state.tasks,
      {
        id: uid("task"),
        title: title.trim() || "Untitled task",
        ownerId,
        status: "todo",
        createdAt: Date.now(),
      },
    ],
  };
}

export function updateTaskStatus(
  state: CollaborationState,
  taskId: string,
  status: SessionTask["status"],
): CollaborationState {
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
          }
        : task,
    ),
  };
}

export function summarizeCollaboration(state: CollaborationState) {
  const openAnnotations = state.annotations.filter((annotation) => !annotation.resolved).length;
  const openTasks = state.tasks.filter((task) => task.status !== "done").length;
  return {
    users: state.users.length,
    openAnnotations,
    openTasks,
    doneTasks: state.tasks.filter((task) => task.status === "done").length,
  };
}
