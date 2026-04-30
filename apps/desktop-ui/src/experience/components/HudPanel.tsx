import { memo, type PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { HUD_SPRING } from "../../theme/ThemeConfig";

type HudPanelProps = PropsWithChildren<{
  open: boolean;
  position?: "left" | "right";
  title: string;
  onClose?: () => void;
}>;

export const HudPanel = memo(function HudPanel({
  open,
  position = "left",
  title,
  onClose,
  children,
}: HudPanelProps) {
  const offset = position === "left" ? -24 : 24;
  const alignClass = position === "left" ? "left-6" : "right-6";

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          className={`pointer-events-auto fixed top-16 ${alignClass} w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[var(--les-surface)]/80 p-5 text-sm text-white/90 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md`}
          initial={{ opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: offset }}
          transition={{ type: "spring", stiffness: HUD_SPRING.stiffness, damping: HUD_SPRING.damping }}
        >
          <header className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/50">
            <span>{title}</span>
            {onClose ? (
              <button
                className="rounded-full p-1 text-white/60 transition hover:text-white"
                onClick={onClose}
                type="button"
                aria-label={`Close ${title}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </header>
          {children}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
});
