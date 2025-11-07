import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon = 'chart-bar', color }) => {
  const theme = useTheme();
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={32} color={color ?? theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="labelLarge" style={styles.label}>
            {label}
          </Text>
          <Text variant="headlineMedium" style={styles.value}>
            {value}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    minWidth: 180,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '600',
  },
});
