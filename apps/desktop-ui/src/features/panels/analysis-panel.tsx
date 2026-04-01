import { useEffect, useState } from "react";
import type {
  ComponentTemplatePreset,
  HealthReport,
  SelectionAlignMode,
  SelectionDistributeAxis,
  WorkspacePreferences,
  WorkspacePreset,
} from "../ui-store.types";

type AnalysisPanelProps = {
  drcViolations: number;
  routeStatus: string;
  simulationSummary: string;
  routeFrom: string | null;
  routeTo: string | null;
  routeOptions: Array<{ id: string; name: string }>;
  simulationConfig: { timeStep: number; steps: number; initialEnergy: number };
  rules: { minSpacingUm: number; gridStepUm: number };
  qualityScore: number | null;
  qualitySummary: string;
  workspacePreferences: WorkspacePreferences;
  workspacePresets: WorkspacePreset[];
  selectionCount: number;
  healthReport: HealthReport | null;
  onSetRouteEndpoints: (from: string | null, to: string | null) => void;
  onSetSimulationConfig: (config: {
    timeStep?: number;
    steps?: number;
    initialEnergy?: number;
  }) => void;
  onUpdateWorkspacePreferences: (patch: Partial<WorkspacePreferences>) => void;
  onSaveWorkspacePreset: (name: string) => void;
  onApplyWorkspacePreset: (name: string) => void;
  onDeleteWorkspacePreset: (name: string) => void;
  onAlignSelection: (mode: SelectionAlignMode) => void;
  onDistributeSelection: (axis: SelectionDistributeAxis) => void;
  onUpdateRules: (rules: { minSpacingUm: number; gridStepUm: number }) => void;
  onClearLogs: () => void;
  onRunDrc: () => void;
  onRunRoute: () => void;
  onRunSimulation: () => void;
  onRunQualitySuite: () => void;
  onGenerateHealthReport: () => void;
  onPlaceTemplate: (template: ComponentTemplatePreset) => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onImportJson: () => void;
};

function shortId(value: string) {
  return value.slice(0, 8);
}

function validRuleValue(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function AnalysisPanel({
  drcViolations,
  routeStatus,
  simulationSummary,
  routeFrom,
  routeTo,
  routeOptions,
  simulationConfig,
  rules,
  qualityScore,
  qualitySummary,
  workspacePreferences,
  workspacePresets,
  selectionCount,
  healthReport,
  onSetRouteEndpoints,
  onSetSimulationConfig,
  onUpdateWorkspacePreferences,
  onSaveWorkspacePreset,
  onApplyWorkspacePreset,
  onDeleteWorkspacePreset,
  onAlignSelection,
  onDistributeSelection,
  onUpdateRules,
  onClearLogs,
  onRunDrc,
  onRunRoute,
  onRunSimulation,
  onRunQualitySuite,
  onGenerateHealthReport,
  onPlaceTemplate,
  onExportJson,
  onExportSvg,
  onImportJson,
}: AnalysisPanelProps) {
  const hasRouteTargets = routeOptions.length > 1;
  const [rulesDraft, setRulesDraft] = useState(rules);
  const [presetName, setPresetName] = useState("");
  const rulesValid =
    validRuleValue(rulesDraft.minSpacingUm) &&
    validRuleValue(rulesDraft.gridStepUm) &&
    rulesDraft.minSpacingUm % rulesDraft.gridStepUm === 0;

  useEffect(() => {
    setRulesDraft(rules);
  }, [rules]);

  return (
    <section className="stack">
      <h2 className="panel-title">Analysis</h2>
      <div className="analysis-metrics">
        <div className="metric-card">
          <strong>DRC Violations</strong>
          <span>{drcViolations}</span>
          <label>
            Min spacing (um)
            <input
              className="field"
              min={1}
              onChange={(event) =>
                setRulesDraft((previous) => ({
                  ...previous,
                  minSpacingUm: Number(event.target.value),
                }))
              }
              type="number"
              value={rulesDraft.minSpacingUm}
            />
          </label>
          <label>
            Grid step (um)
            <input
              className="field"
              min={1}
              onChange={(event) =>
                setRulesDraft((previous) => ({
                  ...previous,
                  gridStepUm: Number(event.target.value),
                }))
              }
              type="number"
              value={rulesDraft.gridStepUm}
            />
          </label>
          <button
            className="action-btn"
            disabled={!rulesValid}
            onClick={() => onUpdateRules(rulesDraft)}
            type="button"
          >
            Apply Rules
          </button>
          <button className="action-btn" disabled={!rulesValid} onClick={onRunDrc} type="button">
            Run DRC
          </button>
        </div>

        <div className="metric-card">
          <strong>Routing</strong>
          <span>{routeStatus}</span>
          <label>
            From
            <select
              className="field"
              onChange={(event) => onSetRouteEndpoints(event.target.value || null, routeTo)}
              value={routeFrom ?? ""}
            >
              <option value="">None</option>
              {routeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select
              className="field"
              onChange={(event) => onSetRouteEndpoints(routeFrom, event.target.value || null)}
              value={routeTo ?? ""}
            >
              <option value="">None</option>
              {routeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <button className="action-btn" disabled={!hasRouteTargets} onClick={onRunRoute} type="button">
            Route
          </button>
          {!hasRouteTargets ? <span>Place at least two components to route.</span> : null}
          {hasRouteTargets && routeFrom && routeTo ? (
            <span>{`Pair: ${shortId(routeFrom)} to ${shortId(routeTo)}`}</span>
          ) : null}
        </div>

        <div className="metric-card">
          <strong>Simulation</strong>
          <span>{simulationSummary}</span>
          <label>
            Time step
            <input
              className="field"
              min={0.0001}
              onChange={(event) => onSetSimulationConfig({ timeStep: Number(event.target.value) })}
              step={0.0001}
              type="number"
              value={simulationConfig.timeStep}
            />
          </label>
          <label>
            Steps
            <input
              className="field"
              min={1}
              onChange={(event) => onSetSimulationConfig({ steps: Number(event.target.value) })}
              type="number"
              value={simulationConfig.steps}
            />
          </label>
          <label>
            Initial energy
            <input
              className="field"
              min={0}
              onChange={(event) => onSetSimulationConfig({ initialEnergy: Number(event.target.value) })}
              step={0.1}
              type="number"
              value={simulationConfig.initialEnergy}
            />
          </label>
          <button className="action-btn" onClick={onRunSimulation} type="button">
            Run Simulation
          </button>
        </div>

        <div className="metric-card">
          <strong>Quality Suite</strong>
          <span>{qualitySummary}</span>
          <span>{qualityScore === null ? "Run required" : `Score: ${qualityScore}/100`}</span>
          <button className="action-btn" onClick={onRunQualitySuite} type="button">
            Run Quality Suite
          </button>
          <button className="action-btn" onClick={onGenerateHealthReport} type="button">
            Generate Health Report
          </button>
          {healthReport ? (
            <div className="health-report">
              <strong>{healthReport.summary}</strong>
              <ul className="list">
                {healthReport.details.slice(0, 5).map((line) => (
                  <li className="list-item" key={line}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="metric-card">
          <strong>Multi-select Layout</strong>
          <span>{selectionCount} selected</span>
          <div className="metric-actions metric-actions-inline">
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("left")} type="button">
              Align Left
            </button>
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("right")} type="button">
              Align Right
            </button>
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("top")} type="button">
              Align Top
            </button>
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("bottom")} type="button">
              Align Bottom
            </button>
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("center_x")} type="button">
              Align Center X
            </button>
            <button className="action-btn" disabled={selectionCount < 2} onClick={() => onAlignSelection("center_y")} type="button">
              Align Center Y
            </button>
            <button className="action-btn" disabled={selectionCount < 3} onClick={() => onDistributeSelection("horizontal")} type="button">
              Distribute H
            </button>
            <button className="action-btn" disabled={selectionCount < 3} onClick={() => onDistributeSelection("vertical")} type="button">
              Distribute V
            </button>
          </div>
        </div>

        <div className="metric-card">
          <strong>Templates</strong>
          <span>Scaffold component topologies</span>
          <div className="metric-actions">
            <button className="action-btn" onClick={() => onPlaceTemplate("line_5")} type="button">
              Place Line x5
            </button>
            <button className="action-btn" onClick={() => onPlaceTemplate("ring_8")} type="button">
              Place Ring x8
            </button>
            <button className="action-btn" onClick={() => onPlaceTemplate("grid_3x3")} type="button">
              Place Grid 3x3
            </button>
          </div>
        </div>

        <div className="metric-card">
          <strong>Workspace</strong>
          <span>Local preferences</span>
          <label>
            Autosave interval (sec)
            <input
              className="field"
              min={5}
              onChange={(event) =>
                onUpdateWorkspacePreferences({ autosaveIntervalSec: Number(event.target.value) })
              }
              type="number"
              value={workspacePreferences.autosaveIntervalSec}
            />
          </label>
          <label>
            Nudge / layout step (um)
            <input
              className="field"
              min={10}
              onChange={(event) =>
                onUpdateWorkspacePreferences({ coordinateStepUm: Number(event.target.value) })
              }
              type="number"
              value={workspacePreferences.coordinateStepUm}
            />
          </label>
          <label>
            Accent
            <select
              className="field"
              onChange={(event) =>
                onUpdateWorkspacePreferences({
                  accent: event.target.value as WorkspacePreferences["accent"],
                })
              }
              value={workspacePreferences.accent}
            >
              <option value="sky">Sky</option>
              <option value="emerald">Emerald</option>
              <option value="amber">Amber</option>
            </select>
          </label>
          <label>
            Density
            <select
              className="field"
              onChange={(event) =>
                onUpdateWorkspacePreferences({
                  density: event.target.value as WorkspacePreferences["density"],
                })
              }
              value={workspacePreferences.density}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="inline-toggle">
            <input
              checked={workspacePreferences.showStatusHints}
              onChange={(event) =>
                onUpdateWorkspacePreferences({ showStatusHints: event.target.checked })
              }
              type="checkbox"
            />
            <span>Show shortcut hints in status bar</span>
          </label>
          <label>
            Save preset
            <input
              className="field"
              onChange={(event) => setPresetName(event.target.value)}
              placeholder="e.g. Dense Routing"
              value={presetName}
            />
          </label>
          <button
            className="action-btn"
            disabled={presetName.trim().length === 0}
            onClick={() => {
              const name = presetName.trim();
              if (!name) {
                return;
              }
              onSaveWorkspacePreset(name);
              setPresetName("");
            }}
            type="button"
          >
            Save Preset
          </button>
          <div className="metric-actions">
            {workspacePresets.length === 0 ? (
              <span>No presets saved</span>
            ) : (
              workspacePresets.map((preset) => (
                <div className="preset-row" key={preset.name}>
                  <span>{preset.name}</span>
                  <div className="preset-actions">
                    <button className="action-btn" onClick={() => onApplyWorkspacePreset(preset.name)} type="button">
                      Apply
                    </button>
                    <button className="action-btn" onClick={() => onDeleteWorkspacePreset(preset.name)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="metric-card">
          <strong>Import / Export</strong>
          <span>Boundary adapters</span>
          <div className="metric-actions">
            <button className="action-btn" onClick={onExportJson} type="button">
              Export JSON
            </button>
            <button className="action-btn" onClick={onExportSvg} type="button">
              Export SVG
            </button>
            <button className="action-btn" onClick={onImportJson} type="button">
              Import JSON
            </button>
            <button className="action-btn" onClick={onClearLogs} type="button">
              Clear Activity Log
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
