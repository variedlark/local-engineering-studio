import type { PcpLifecycleReport } from "../pcp/pcp-lifecycle";

type PcpLifecyclePanelProps = {
  report: PcpLifecycleReport;
};

function passClass(passes: boolean) {
  return passes ? "status-chip status-chip-good" : "status-chip status-chip-critical";
}

export function PcpLifecyclePanel({ report }: PcpLifecyclePanelProps) {
  return (
    <section className="stack pcp-lifecycle-panel">
      <h2 className="panel-title">PCP Lifecycle</h2>
      <p className="panel-subtle">Schematic to manufacturing readiness computed from live project state.</p>

      {!report.hasDesignData ? (
        <div className="list-item">Place components to enable lifecycle analysis.</div>
      ) : (
        <>
          <div className="pcp-lifecycle-grid">
            <article className="list-item pcp-lifecycle-card">
              <strong>Schematic</strong>
              <span>
                {report.schematic.symbolCount} symbols, {report.schematic.netCount} nets, {report.schematic.nodeCount} nodes
              </span>
              <span className={passClass(report.schematic.valid)}>
                {report.schematic.valid ? "valid" : `${report.schematic.errors} issues`}
              </span>
            </article>

            <article className="list-item pcp-lifecycle-card">
              <strong>Layout</strong>
              <span>
                {report.layout.componentCount} components, {report.layout.trackCount} tracks
              </span>
              <span className="panel-subtle">Track length {report.layout.totalTrackLength} um</span>
              <span className={passClass(report.layout.valid)}>
                {report.layout.valid ? "valid" : `${report.layout.issues} issues`}
              </span>
            </article>

            <article className="list-item pcp-lifecycle-card">
              <strong>Routing + DRC</strong>
              <span>
                Routed {report.routing.routed}/{report.routing.requested} nets, score {report.routing.score}
              </span>
              <span className="panel-subtle">Cost {report.routing.totalCost}</span>
              <span className={passClass(report.drc.passes)}>
                {report.drc.passes ? "DRC pass" : `${report.drc.issueCount} rule issues`}
              </span>
            </article>

            <article className="list-item pcp-lifecycle-card">
              <strong>Manufacturing</strong>
              <span>{report.manufacturing.fileCount} files in package</span>
              <span className="panel-subtle">{report.manufacturing.formats.join(", ") || "No formats"}</span>
              <span className="status-chip status-chip-neutral">{report.drc.summary}</span>
            </article>

            <article className="list-item pcp-lifecycle-card">
              <strong>Catalog</strong>
              <span>
                {report.catalog.total} indexed entries, {report.catalog.active} active
              </span>
              <span className="panel-subtle">{report.catalog.candidates} active candidates selected</span>
              <span className="status-chip status-chip-good">query ready</span>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
