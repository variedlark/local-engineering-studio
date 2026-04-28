import { memo, type ReactNode } from "react";

type HudDockItem = {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
};

type HudDockProps = {
  items: HudDockItem[];
  onCommand: () => void;
};

export const HudDock = memo(function HudDock({ items, onCommand }: HudDockProps) {
  return (
    <div className="pointer-events-auto fixed left-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-full border border-white/10 bg-[var(--les-surface)]/70 p-2 backdrop-blur-md">
      <button
        type="button"
        onClick={onCommand}
        aria-label="Open Command Bar"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:text-white"
      >
        <span className="text-[10px] font-mono tracking-[0.2em]">⌘K</span>
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-label={item.label}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition ${
            item.active ? "bg-white/10 text-white" : "bg-white/5 text-white/60 hover:text-white"
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
});
