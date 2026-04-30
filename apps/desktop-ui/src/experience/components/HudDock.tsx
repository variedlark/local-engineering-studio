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
    <div className="hud-dock pointer-events-auto fixed left-4 top-4 z-30 flex flex-row items-center gap-2 p-2 md:left-6 md:top-1/2 md:-translate-y-1/2 md:flex-col md:gap-3">
      <button
        type="button"
        onClick={onCommand}
        aria-label="Open Command Bar"
        className="hud-dock-btn flex h-10 w-10 items-center justify-center"
      >
        <span className="text-[10px] font-mono tracking-[0.2em]">⌘K</span>
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-label={item.label}
          className={`hud-dock-btn flex h-10 w-10 items-center justify-center ${
            item.active ? "hud-dock-btn-active text-white" : "text-white/60 hover:text-white"
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
});
