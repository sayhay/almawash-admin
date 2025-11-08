import React from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { PressableProps } from 'react-native';
import { useTheme } from '@shopify/restyle';

import type { AppTheme } from '@/theme';
import { Text } from '@/theme';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const PrimaryButton = React.forwardRef<React.ElementRef<typeof Pressable>, PrimaryButtonProps>(
  ({ label, loading = false, disabled, onPress, fullWidth = false, style, ...rest }, ref) => {
    const theme = useTheme<AppTheme>();
    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        android_ripple={{ color: theme.colors.primaryHover }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: isDisabled
              ? theme.colors.muted
              : pressed
                ? theme.colors.primaryHover
                : theme.colors.primary,
            opacity: isDisabled ? 0.72 : 1,
            borderRadius: theme.radii.sm,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} size="small" />
        ) : (
          <Text variant="body" style={styles.label} color="onPrimary">
            {label}
          </Text>
        )}
      </Pressable>
    );
  },
);

PrimaryButton.displayName = 'PrimaryButton';

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 44,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  label: {
    fontWeight: '600',
  },
});
