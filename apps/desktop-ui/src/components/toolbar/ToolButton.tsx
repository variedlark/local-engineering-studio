import type { ReactNode } from "react";

type ToolButtonProps = {
  label: string;
  shortcut: string;
  active?: boolean;
  icon: ReactNode;
  onClick: () => void;
};

export function ToolButton({
  label,
  shortcut,
  active = false,
  icon,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`studio-tool-button ${active ? "studio-tool-button-active" : ""}`}
      aria-pressed={active}
      aria-label={`${label} tool (${shortcut})`}
      title={`${label} · ${shortcut}`}
      onClick={onClick}
    >
      {icon}
      <span>{shortcut}</span>
    </button>
  );
}
