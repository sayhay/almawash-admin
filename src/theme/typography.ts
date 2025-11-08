export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
  },
  lineHeights: {
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
  },
} as const;

export type TypographyTokens = typeof typography;
