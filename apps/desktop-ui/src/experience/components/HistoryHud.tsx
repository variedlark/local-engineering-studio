import { memo } from "react";
import type { ActivityEvent } from "../../features/ui-store.types";

type HistoryHudProps = {
  activityEvents: ActivityEvent[];
  logs: string[];
};

export const HistoryHud = memo(function HistoryHud({ activityEvents, logs }: HistoryHudProps) {
  const recentEvents = activityEvents.slice(0, 4);
  const recentLogs = logs.slice(0, 4);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Activity</p>
        <div className="mt-2 space-y-2 text-xs text-white/70">
          {recentEvents.length === 0 ? (
            <p className="text-white/40">No activity yet.</p>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span className="text-white/80">{event.title}</span>
                <span className="font-mono text-[10px] text-white/40">{event.detail}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">Logs</p>
        <div className="mt-2 space-y-2 text-xs text-white/70">
          {recentLogs.length === 0 ? (
            <p className="text-white/40">No logs yet.</p>
          ) : (
            recentLogs.map((log, index) => (
              <div key={`${log}-${index}`} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                <span className="font-mono text-[10px] text-white/60">{log}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
