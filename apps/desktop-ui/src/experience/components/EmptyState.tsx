import { memo } from "react";
import type { ComponentTemplatePreset } from "../../features/ui-store.types";

type EmptyStateProps = {
  recentProjects: Array<{ name: string; detail: string }>;
  templates: Array<{ id: ComponentTemplatePreset; name: string; detail: string }>;
  onSelectTemplate: (template: ComponentTemplatePreset) => void;
};

export const EmptyState = memo(function EmptyState({
  recentProjects,
  templates,
  onSelectTemplate,
}: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-3xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Local Engineering Studio</p>
        <h1 className="mt-4 text-3xl font-semibold text-white/90">Welcome to the immersive workspace</h1>
        <p className="mt-3 text-sm text-white/50">
          The canvas is your primary focus. Use the command bar or quick templates to start.
        </p>

        <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_34px_rgba(0,0,0,0.3)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Recent Projects</p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              {recentProjects.length === 0 ? (
                <p className="text-white/40">No recent projects yet.</p>
              ) : (
                recentProjects.map((project) => (
                  <div key={project.name} className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <span className="text-[10px] font-mono text-white/40">{project.detail}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_34px_rgba(0,0,0,0.3)] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Quick Start Templates</p>
            <div className="mt-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  <span>{template.name}</span>
                  <span className="text-[10px] font-mono text-white/40">{template.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
