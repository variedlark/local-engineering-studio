import type { CSSProperties, PropsWithChildren } from "react";
import { THEME_CSS_VARIABLES } from "./ThemeConfig";

export function ThemeProvider({ children }: PropsWithChildren) {
  return <div style={THEME_CSS_VARIABLES as CSSProperties}>{children}</div>;
}
