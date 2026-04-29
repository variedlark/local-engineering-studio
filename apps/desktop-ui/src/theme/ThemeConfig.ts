export const THEME_CONFIG = {
  colors: {
    background: "#050505",
    surface: "rgba(12, 12, 12, 0.68)",
    surfaceStrong: "rgba(16, 16, 16, 0.9)",
    border: "rgba(255, 255, 255, 0.1)",
    text: "#f4f6f8",
    muted: "#a6adb7",
    accent: "#2ee8ff",
    accentAlt: "#ff4fd8",
    selection: "rgba(110, 246, 255, 0.65)",
    grid: "rgba(255, 255, 255, 0.12)",
    success: "#3ddc97",
    warning: "#f2c94c",
    danger: "#ff6b6b",
  },
  typography: {
    sans: '"Inter", "SF Pro Text", "Segoe UI", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
  },
  radius: {
    hud: "16px",
    input: "12px",
  },
  sizes: {
    statusBarHeight: "24px",
    nodeRadius: 6,
  },
};

export const THEME_CSS_VARIABLES = {
  "--les-bg": THEME_CONFIG.colors.background,
  "--les-surface": THEME_CONFIG.colors.surface,
  "--les-surface-strong": THEME_CONFIG.colors.surfaceStrong,
  "--les-border": THEME_CONFIG.colors.border,
  "--les-text": THEME_CONFIG.colors.text,
  "--les-text-muted": THEME_CONFIG.colors.muted,
  "--les-accent": THEME_CONFIG.colors.accent,
  "--les-accent-alt": THEME_CONFIG.colors.accentAlt,
  "--les-selection": THEME_CONFIG.colors.selection,
  "--les-grid": THEME_CONFIG.colors.grid,
  "--les-success": THEME_CONFIG.colors.success,
  "--les-warning": THEME_CONFIG.colors.warning,
  "--les-danger": THEME_CONFIG.colors.danger,
  "--les-font-sans": THEME_CONFIG.typography.sans,
  "--les-font-mono": THEME_CONFIG.typography.mono,
  "--les-status-height": THEME_CONFIG.sizes.statusBarHeight,
} as const;

export const HUD_SPRING = {
  stiffness: 300,
  damping: 30,
};
