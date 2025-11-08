import { createBox, createText, createTheme } from '@shopify/restyle';

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

const baseColors = {
  primary: colors.brand[500],
  primaryHover: colors.brand[600],
  onPrimary: '#ffffff',
  accent: colors.accent,
  background: colors.backgroundLight,
  surface: colors.surfaceLight,
  surfaceMuted: colors.gray[50],
  surfaceStrong: colors.gray[100],
  text: colors.gray[800],
  textSecondary: colors.gray[600],
  muted: colors.gray[500],
  border: colors.gray[200],
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
};

export const theme = createTheme({
  colors: {
    ...baseColors,
  },
  spacing,
  radii,
  textVariants: {
    body: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.md,
      lineHeight: typography.lineHeights.md,
      color: 'text',
    },
    title: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.xl,
      fontWeight: '600',
      lineHeight: typography.lineHeights.lg,
      color: 'text',
    },
    caption: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.sm,
      lineHeight: typography.lineHeights.sm,
      color: 'muted',
    },
  },
  breakpoints: {
    phone: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },
});

export const themeDark = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceMuted: colors.gray[900],
    surfaceStrong: colors.gray[800],
    text: colors.gray[50],
    textSecondary: colors.gray[200],
    muted: colors.gray[400],
    border: colors.gray[700],
  },
});

export type AppTheme = typeof theme;

export const Box = createBox<AppTheme>();
export const Text = createText<AppTheme>();

export const getThemeByMode = (mode: 'light' | 'dark') => (mode === 'dark' ? themeDark : theme);

export * from './colors';
export * from './spacing';
export * from './typography';
