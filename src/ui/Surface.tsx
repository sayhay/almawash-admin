import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import type { BoxProps } from '@shopify/restyle';

import { Box } from '@/theme';
import type { AppTheme } from '@/theme';

export type SurfaceProps = BoxProps<AppTheme> & {
  children: React.ReactNode;
};

export const Surface: React.FC<SurfaceProps> = ({ children, ...rest }) => (
  <Box
    backgroundColor="surface"
    borderRadius="md"
    padding="lg"
    style={styles.shadow}
    {...rest}
  >
    {children}
  </Box>
);

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      default: {
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
});
