import type { AppProject } from "../domain/types";

type ComponentMap = NonNullable<AppProject>["model"]["components"];

export type SnapshotSelectionState = {
  selectedComponentId: string | null;
  selectedComponentIds: string[];
  routeEndpoints: { from: string | null; to: string | null };
  statusMessage: string;
};

export function firstComponentId(components: ComponentMap): string | null {
  return Object.keys(components)[0] ?? null;
}

export function resolveSelectedComponentId(desired: string | null, components: ComponentMap): string | null {
  if (desired && components[desired]) {
    return desired;
  }
  return firstComponentId(components);
}

function defaultRouteEndpoints(components: ComponentMap) {
  const ids = Object.keys(components);
  return {
    from: ids[0] ?? null,
    to: ids[1] ?? ids[0] ?? null,
  };
}

export function dedupeSelection(componentIds: string[]) {
  return [...new Set(componentIds.filter((id) => id.length > 0))];
}

export function applySnapshotToState(
  state: SnapshotSelectionState,
  snapshot: AppProject,
  statusMessage?: string,
) {
  const selected = resolveSelectedComponentId(state.selectedComponentId, snapshot.model.components);
  const selectedMany = dedupeSelection(
    state.selectedComponentIds.filter((componentId) => Boolean(snapshot.model.components[componentId])),
  );
  const defaults = defaultRouteEndpoints(snapshot.model.components);
  const from =
    state.routeEndpoints.from && snapshot.model.components[state.routeEndpoints.from]
      ? state.routeEndpoints.from
      : defaults.from;
  const to =
    state.routeEndpoints.to && snapshot.model.components[state.routeEndpoints.to]
      ? state.routeEndpoints.to
      : defaults.to;

  return {
    project: snapshot,
    selectedComponentId: selected,
    selectedComponentIds:
      selectedMany.length > 0
        ? selectedMany
        : selected
          ? [selected]
          : [],
    routeEndpoints: { from, to },
    rules: {
      minSpacingUm: snapshot.model.rules.min_spacing_um,
      gridStepUm: snapshot.model.rules.grid_step_um,
    },
    statusMessage: statusMessage ?? state.statusMessage,
  };
}
