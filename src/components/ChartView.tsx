import type { AppTheme } from '@/theme';
import { Text } from '@/theme';
import { Surface } from '@/ui/Surface';
import { useTheme } from '@shopify/restyle';
import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import type { RevenuePoint } from '../utils/types';


// Charge la bonne lib Victory selon la plateforme (web: 'victory', natif: 'victory-native')
function useVictory() {
  // require() évite que le bundler charge le mauvais paquet
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Platform.OS === 'web' ? require('victory') : require('victory-native');
}

interface ChartViewProps {
  title: string;
  data: RevenuePoint[];
}

export const ChartView: React.FC<ChartViewProps> = ({ title, data }) => {
  // Thème Restyle (ton design system)
  const themeRN = useTheme<AppTheme>();
  const chartWidth = Math.max(Dimensions.get('window').width - 64, 320);

  // Mémoïse l’accès aux composants Victory
  const { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } = useMemo(useVictory, []);

  // Thème Victory (pour le chart uniquement)
  const victoryTheme =
    (VictoryTheme && (VictoryTheme.material || VictoryTheme.grayscale)) || undefined;

  // tickFormat safe
  const formatMonth = (tick: unknown) => {
    const s = typeof tick === 'string' ? tick : String(tick ?? '');
    return s.slice(0, 3);
  };

  const formatK = (tick: unknown) => {
    const n = typeof tick === 'number' ? tick : Number(tick ?? 0);
    return `${Math.round(n / 1000)}k`;
  };

  return (
    <Surface marginBottom="xl">
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <View style={{ width: chartWidth }}>
        <VictoryChart theme={victoryTheme} width={chartWidth} height={240} domainPadding={{ x: 20 }}>
          <VictoryAxis
            tickFormat={formatMonth}
            style={{ tickLabels: { fontSize: 10, fill: themeRN.colors.muted } }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={formatK}
            style={{ tickLabels: { fontSize: 10, fill: themeRN.colors.muted } }}
          />
          <VictoryLine
            data={data}
            x="month"
            y="value"
            interpolation="natural"
            style={{ data: { strokeWidth: 2, stroke: themeRN.colors.primary } }}
          />
        </VictoryChart>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
});
