import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

import type { RevenuePoint } from '../utils/types';

interface ChartViewProps {
  title: string;
  data: RevenuePoint[];
}

export const ChartView: React.FC<ChartViewProps> = ({ title, data }) => {
  const chartWidth = Math.max(Dimensions.get('window').width - 64, 320);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <View style={{ width: chartWidth }}>
          <VictoryChart theme={VictoryTheme.material} width={chartWidth} height={240}>
            <VictoryAxis tickFormat={(tick) => tick.slice(0, 3)} style={{ tickLabels: { fontSize: 10 } }} />
            <VictoryAxis dependentAxis tickFormat={(tick) => `${tick / 1000}k`} style={{ tickLabels: { fontSize: 10 } }} />
            <VictoryLine data={data} x="month" y="value" interpolation="natural" />
          </VictoryChart>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
  },
  title: {
    marginBottom: 12,
  },
});
