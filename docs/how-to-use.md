# How To Use Local Engineering Studio

This guide walks through the current desktop app workflow end-to-end.

## 1) Launch the app

1. Install dependencies from repo root:

```bash
pnpm install
cargo check
```

2. Start the desktop shell:

```bash
pnpm --filter desktop-shell tauri:dev
```

The app opens with a project loaded or created automatically.

## 2) Understand the layout

- Left: **Project Structure** (project metadata, component list, selection summary).
- Center: **Canvas** (component count, route and simulation summaries, quick actions).
- Right: **Inspector** (edit selected component).
- Lower-right: **Analysis** (rules, DRC, routing, simulation, import/export).
- Bottom: **Activity Log**, **History**, and **Status Bar**.

## 3) Create and select components

1. Click `Place` in the top toolbar (or `Place Component` in canvas).
2. Repeat to add more components.
3. Select a component from either:
   - Project sidebar list, or
   - Inspector `Selection` dropdown.

Tip: Use sidebar filter (`Filter components...`) for faster selection in larger designs.

## 4) Edit component details (Inspector)

With a component selected:

1. Change `Name` and click `Apply Name`.
2. Change `Position X` / `Position Y` and click `Apply Position`.
3. Change `Layer` and click `Apply Layer`.
4. Optional actions:
   - `Duplicate Component`
   - `Delete Component`

Constraints:

- Layer is clamped to `-32..32`.
- Empty names are rejected.

## 5) Rename the project

1. In Project Structure, edit `Project Name`.
2. Click `Rename Project`.

Project revision and status update immediately.

## 6) Arrange quickly from toolbar/canvas

- `Nudge Left` / `Nudge Right`: move selected component by fixed step.
- `Center Selection` (canvas): move selected component to origin region.
- `Fit All` (canvas): auto-arrange all components into a grid.

## 7) Use interactive canvas controls

- Drag component nodes directly in the canvas to reposition them.
- Mouse wheel zooms in/out around the current view.
- Use pan controls (`Pan Left/Right/Up/Down`) to navigate.
- Toggle `Show/Hide Grid` and `Enable/Disable Snap`.
- Use `Reset View` to return to default viewport.
- Double-click on canvas clears selection.

## 8) Configure rules and run DRC

In Analysis -> DRC:

1. Set `Min spacing (um)`.
2. Set `Grid step (um)`.
3. Click `Apply Rules`.
4. Click `Run DRC`.

Rule requirement: minimum spacing must be an integer multiple of grid step.

## 9) Route between components

In Analysis -> Routing:

1. Choose `From` component.
2. Choose `To` component.
3. Click `Route`.

You will see route status and path summary in the canvas and status area.

Note: routing currently fails across different layers by design.

## 10) Run simulation

In Analysis -> Simulation:

1. Set `Time step`.
2. Set `Steps`.
3. Set `Initial energy`.
4. Click `Run Simulation`.

Summary appears in Analysis, canvas, and status bar.

## 11) Save, autosave, undo/redo

- `Save` button: persists project bundle.
- Autosave runs periodically.
- `Undo` / `Redo` available in toolbar and shortcuts.

Status bar shows revision, dirty/saved state, and active status message.

## 12) Import and export

In Analysis -> Import / Export:

- `Export JSON`: writes `project-export.json` under the project exports directory.
- `Export SVG`: writes `layout.svg` under the project exports directory.
- `Import JSON`: imports from `./local-projects/import/project-export.json` into a new project.

## 13) Command palette and shortcuts

Open palette with `Cmd/Ctrl+K` to run actions by search.

Primary shortcuts:

- `Cmd/Ctrl+K`: command palette
- `Cmd/Ctrl+S`: save
- `Cmd/Ctrl+A`: autosave
- `Cmd/Ctrl+D`: duplicate selected component
- `Cmd/Ctrl+Z`: undo
- `Cmd/Ctrl+Shift+Z` or `Cmd/Ctrl+Y`: redo
- `F5`: run DRC
- `F6`: run route
- `F7`: run simulation
- `F8`: run quality suite
- `Shift+Arrow keys`: pan canvas
- `Cmd/Ctrl+=`: zoom in
- `Cmd/Ctrl+-`: zoom out
- `Cmd/Ctrl+Shift+R`: reset viewport

## 14) Run templates and quality suite

Use Analysis panel:

- **Templates** card to place quick topologies:
  - `Place Line x5`
  - `Place Ring x8`
  - `Place Grid 3x3`
- **Quality Suite** card to run a combined score pass.

The quality score merges DRC, route feasibility, and simulation stability into one indicator for quick iteration.

## 15) Customize workspace preferences

Use Analysis -> **Workspace**:

- Set autosave interval in seconds.
- Set nudge/layout coordinate step in micrometers.
- Set accent theme (`Sky`, `Emerald`, `Amber`).
- Set density (`Comfortable`, `Compact`).
- Toggle shortcut hints in status bar.

Preferences are stored locally in browser/desktop local storage and apply on next launch.

## 16) Use history for auditability

- Open the **History** panel to review command/analysis/system events.
- Filter by event kind (`command`, `analysis`, `quality`, `template`, `system`).
- Search history by title/detail text.
- Use `Clear` to reset the local history view.

## 17) Verify quality after changes

From repo root:

```bash
pnpm --filter desktop-ui check
pnpm --filter desktop-ui lint
pnpm --filter desktop-ui test
pnpm --filter desktop-ui build
cargo fmt --all --check
cargo check
cargo test
cargo clippy --workspace --all-targets -- -D warnings
```

## 18) Use the extended operations deck

The expanded app now includes additional productivity surfaces:

- **Command Deck**: live KPI cards for revision, quality, route, simulation, and activity pulse.
- **Quick Actions**: one-click access to high-frequency operations.
- **Session Notes**: persist local notes for rationale, TODOs, and handoff context.
- **Viewport Snapshots**: save and re-apply camera/grid states.
- **Recommendations**: context-aware guidance generated from quality, route, simulation, and workflow signals.

These are local-first and designed for iterative engineering loops.
