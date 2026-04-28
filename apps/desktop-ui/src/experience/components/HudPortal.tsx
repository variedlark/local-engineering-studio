import type { PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function HudPortal({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    let root = document.getElementById("hud-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "hud-root";
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  if (!mounted) {
    return null;
  }

  return portalRoot ? createPortal(children, portalRoot) : null;
}
