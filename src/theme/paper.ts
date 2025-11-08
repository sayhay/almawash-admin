import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

import type { AppTheme } from './index';
import { theme, themeDark } from './index';
import { typography } from './typography';

const fontConfig = {
  default: {
    regular: {
      fontFamily: typography.fontFamily,
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: typography.fontFamily,
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: typography.fontFamily,
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: typography.fontFamily,
      fontWeight: '200' as const,
    },
  },
};

const createPaperBase = (mode: 'light' | 'dark', palette: AppTheme['colors']): typeof MD3LightTheme => {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      primaryContainer: palette.primaryHover,
      onPrimary: palette.onPrimary,
      secondary: palette.accent,
      onSecondary: palette.onPrimary,
      background: palette.background,
      surface: palette.surface,
      surfaceVariant: palette.surfaceMuted,
      secondaryContainer: palette.surfaceStrong,
      onSurface: palette.text,
      onSurfaceVariant: palette.textSecondary,
      outline: palette.border,
      error: palette.error,
      onError: palette.onPrimary,
      inversePrimary: palette.primaryHover,
      inverseOnSurface: palette.background,
    },
    roundness: theme.radii.md,
    fonts: configureFonts({ config: fontConfig }),
  };
};

export const createPaperTheme = (mode: 'light' | 'dark', currentTheme: AppTheme) =>
  createPaperBase(mode, currentTheme.colors);

export const paperLightTheme = createPaperTheme('light', theme);
export const paperDarkTheme = createPaperTheme('dark', themeDark);
