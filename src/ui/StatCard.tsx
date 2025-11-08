import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';

import type { AppTheme } from '@/theme';
import { Box, Text } from '@/theme';

type StatCardTone = 'default' | 'success' | 'warning' | 'error' | 'info';

export type StatCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: StatCardTone;
};

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, tone = 'default' }) => {
  const theme = useTheme<AppTheme>();
  const toneColor = (() => {
    switch (tone) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.accent;
    }
  })();

  return (
    <Box
      flex={1}
      backgroundColor="surface"
      borderRadius="md"
      padding="lg"
      style={[styles.shadow, styles.card]}
    >
      <View style={[styles.iconContainer, { backgroundColor: toneColor + '14' }]}>{icon}</View>
      <Text variant="caption" marginTop="sm">
        {label}
      </Text>
      <Box marginTop="sm">
        <Text variant="title">{value}</Text>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15, 23, 42, 0.2)',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      default: {
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
      },
    }),
  },
  card: {
    minWidth: 160,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
