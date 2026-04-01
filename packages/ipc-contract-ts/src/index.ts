import { z } from "zod";

export const point2Schema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export const componentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  position: point2Schema,
  layer: z.number().int().default(0),
});

export const placeComponentSchema = z.object({
  type: z.literal("place_component"),
  component_id: z.string().uuid(),
  name: z.string().min(1),
  position: point2Schema,
});

export const moveComponentSchema = z.object({
  type: z.literal("move_component"),
  component_id: z.string().uuid(),
  to: point2Schema,
});

export const renameComponentSchema = z.object({
  type: z.literal("rename_component"),
  component_id: z.string().uuid(),
  name: z.string().min(1),
});

export const renameProjectSchema = z.object({
  type: z.literal("rename_project"),
  name: z.string().min(1),
});

export const setComponentLayerSchema = z.object({
  type: z.literal("set_component_layer"),
  component_id: z.string().uuid(),
  layer: z.number().int().min(-32).max(32),
});

export const setRulesSchema = z.object({
  type: z.literal("set_rules"),
  min_spacing_um: z.number().int().min(1),
  grid_step_um: z.number().int().min(1),
});

export const deleteComponentSchema = z.object({
  type: z.literal("delete_component"),
  component_id: z.string().uuid(),
});

const nonBatchCommandSchema = z.union([
  placeComponentSchema,
  moveComponentSchema,
  renameComponentSchema,
  renameProjectSchema,
  setComponentLayerSchema,
  setRulesSchema,
  deleteComponentSchema,
]);

export type NonBatchDomainCommand = z.infer<typeof nonBatchCommandSchema>;

export type BatchDomainCommand = {
  type: "batch";
  label: string;
  commands: NonBatchDomainCommand[];
};

export type DomainCommand = NonBatchDomainCommand | BatchDomainCommand;

export const domainCommandSchema: z.ZodType<DomainCommand> = z.lazy(() =>
  z.union([
    nonBatchCommandSchema,
    z.object({
      type: z.literal("batch"),
      label: z.string().min(1),
      commands: z.array(nonBatchCommandSchema).min(1),
    }),
  ]),
);

export const commandRequestSchema = z.object({
  project_id: z.string().uuid(),
  command: domainCommandSchema,
});

export const createProjectResponseSchema = z.object({
  project_id: z.string().uuid(),
});

export const commandResponseSchema = z.object({
  ok: z.boolean(),
  error_code: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  revision: z.number().int().nullable().optional(),
});

export const undoRedoResponseSchema = z.object({
  ok: z.boolean(),
  changed: z.boolean(),
  error_code: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  revision: z.number().int().nullable().optional(),
});

export const drcReportSchema = z.object({
  violations: z.array(
    z.object({
      kind: z.string(),
      message: z.string(),
      component_ids: z.array(z.string().uuid()),
    }),
  ),
  checked_pairs: z.number().int(),
});

export const routeReportSchema = z.object({
  success: z.boolean(),
  path: z.array(z.object({ x: z.number().int(), y: z.number().int() })),
  expanded_nodes: z.number().int(),
});

export const simulationReportSchema = z.object({
  points: z.array(z.object({ t: z.number(), value: z.number() })),
  stable: z.boolean(),
  summary: z.string(),
});

export const projectMetaSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string(),
  format_major: z.number().int(),
  format_minor: z.number().int(),
  created_at_ms: z.number().int(),
  updated_at_ms: z.number().int(),
  revision: z.number().int(),
});

export const projectModelSchema = z.object({
  meta: projectMetaSchema,
  components: z.record(z.string().uuid(), componentSchema),
  nets: z.record(z.string().uuid(), z.unknown()),
  rules: z.object({
    min_spacing_um: z.number().int(),
    grid_step_um: z.number().int(),
  }),
});

export const projectSnapshotSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string(),
  revision: z.number().int(),
  dirty: z.boolean(),
  can_undo: z.boolean(),
  can_redo: z.boolean(),
  last_autosave_ms: z.number().int().nullable().optional(),
  model: projectModelSchema,
});

export const listOpenProjectsResponseSchema = z.object({
  projects: z.array(projectSnapshotSchema),
});

export type CommandRequest = z.infer<typeof commandRequestSchema>;
export type CommandResponse = z.infer<typeof commandResponseSchema>;
export type UndoRedoResponse = z.infer<typeof undoRedoResponseSchema>;
export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;
export type DrcReport = z.infer<typeof drcReportSchema>;
export type RouteReport = z.infer<typeof routeReportSchema>;
export type SimulationReport = z.infer<typeof simulationReportSchema>;
