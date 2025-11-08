import { alpha, createTheme as createMuiThemeBase } from '@mui/material/styles';

import type { AppTheme } from './index';
import { colors } from './colors';
import { typography } from './typography';

export const createMuiThemeFromAppTheme = (mode: 'light' | 'dark', currentTheme: AppTheme) => {
  const palette = currentTheme.colors;
  const brandSelection = mode === 'dark' ? alpha(colors.brand[400], 0.24) : colors.brand[100];
  const hoverColor = mode === 'dark' ? alpha(colors.brand[500], 0.14) : alpha(colors.brand[500], 0.08);

  return createMuiThemeBase({
    palette: {
      mode,
      primary: {
        main: palette.primary,
        contrastText: palette.onPrimary,
      },
      secondary: {
        main: palette.accent,
        contrastText: palette.onPrimary,
      },
      success: { main: palette.success },
      warning: { main: palette.warning },
      error: { main: palette.error },
      info: { main: palette.info },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      text: {
        primary: palette.text,
        secondary: palette.muted,
      },
      divider: palette.border,
    },
    shape: {
      borderRadius: currentTheme.radii.md,
    },
    spacing: (factor: number) => currentTheme.spacing.sm * factor,
    typography: {
      fontFamily: typography.fontFamily,
      fontSize: typography.sizes.md,
      h1: {
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: typography.sizes['2xl'],
        lineHeight: `${typography.lineHeights.xl}px`,
      },
      h2: {
        fontFamily: typography.fontFamily,
        fontWeight: 600,
        fontSize: typography.sizes.xl,
        lineHeight: `${typography.lineHeights.lg}px`,
      },
      body1: {
        fontSize: typography.sizes.md,
        lineHeight: `${typography.lineHeights.md}px`,
      },
      body2: {
        fontSize: typography.sizes.sm,
        lineHeight: `${typography.lineHeights.sm}px`,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
      caption: {
        fontSize: typography.sizes.xs,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: currentTheme.radii.sm,
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: currentTheme.radii.lg,
            backgroundImage: 'none',
          },
        },
      },
      MuiDataGrid: {
        defaultProps: {
          density: 'compact',
          columnHeaderHeight: 48,
          rowHeight: 48,
        },
        styleOverrides: {
          root: {
            border: 'none',
            fontFamily: typography.fontFamily,
            backgroundColor: palette.surface,
            '--DataGrid-cellOffsetMultiplier': 0,
          },
          columnHeaders: {
            borderBottom: `1px solid ${palette.border}`,
            fontWeight: 700,
            backgroundColor: palette.surfaceStrong,
            color: palette.text,
          },
          row: {
            '&:hover': {
              backgroundColor: hoverColor,
            },
            '&.Mui-selected': {
              backgroundColor: brandSelection,
              '&:hover': {
                backgroundColor: brandSelection,
              },
            },
          },
          footerContainer: {
            borderTop: `1px solid ${palette.border}`,
          },
          toolbarContainer: {
            padding: currentTheme.spacing.sm,
            borderBottom: `1px solid ${palette.border}`,
            gap: currentTheme.spacing.sm,
          },
        },
      },
    },
  });
};
