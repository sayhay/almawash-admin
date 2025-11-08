import React from 'react';
import type { BoxProps } from '@shopify/restyle';

import { Box, Text } from '@/theme';
import type { AppTheme } from '@/theme';

import { Surface } from './Surface';

export type SectionProps = Omit<BoxProps<AppTheme>, 'children'> & {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  actions,
  children,
  ...rest
}) => (
  <Box marginBottom="xl" {...rest}>
    <Surface padding="0">
      <Box padding="lg">
        <Box flexDirection="row" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1} marginRight="lg">
            <Text variant="title">{title}</Text>
            {subtitle ? (
              <Box marginTop="xs">
                <Text variant="caption">{subtitle}</Text>
              </Box>
            ) : null}
          </Box>
          {actions ? <Box flexShrink={0}>{actions}</Box> : null}
        </Box>
        <Box marginTop="md">{children}</Box>
      </Box>
    </Surface>
  </Box>
);
