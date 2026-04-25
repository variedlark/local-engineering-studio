import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  dark: {
    name: 'Dark',
    primary: '#6ec1ff',
    secondary: '#2d3f57',
    accent: '#ff6b6b',
    background: '#0f1724',
    surface: '#1a2332',
    text: '#f4f8ff',
    border: '#3a4a5f',
    success: '#51cf66',
    warning: '#ffd43b',
    error: '#ff6b6b',
    info: '#4dabf7',
  },
  light: {
    name: 'Light',
    primary: '#0066cc',
    secondary: '#e8f0f8',
    accent: '#ff4444',
    background: '#ffffff',
    surface: '#f5f7fa',
    text: '#1a1a1a',
    border: '#d0d0d0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  switchPreset: (presetName: string) => void;
  updateThemeProperty: (key: keyof ThemeConfig, value: string) => void;
  getCSSVariables: () => Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(THEME_PRESETS.dark);

  const switchPreset = useCallback((presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setTheme(preset);
    }
  }, []);

  const updateThemeProperty = useCallback((key: keyof ThemeConfig, value: string) => {
    setTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const getCSSVariables = useCallback(() => {
    return {
      '--color-primary': theme.primary,
      '--color-secondary': theme.secondary,
      '--color-accent': theme.accent,
      '--color-background': theme.background,
      '--color-surface': theme.surface,
      '--color-text': theme.text,
      '--color-border': theme.border,
      '--color-success': theme.success,
      '--color-warning': theme.warning,
      '--color-error': theme.error,
      '--color-info': theme.info,
    };
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    switchPreset,
    updateThemeProperty,
    getCSSVariables,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={getCSSVariables() as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
