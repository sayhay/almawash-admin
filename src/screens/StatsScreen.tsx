import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { ChartView } from '../components/ChartView';
import { DataTable } from '../components/DataTable';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { useFetch } from '../hooks/useFetch';
import { formatCurrency } from '../utils/formatters';
import type { AdminStatsResponse, RevenuePoint, TopProvider } from '../utils/types';

const StatsScreen: React.FC = () => {
  const {
    data: stats,
    loading,
    error,
    refetch,
  } = useFetch<AdminStatsResponse>('/api/admin/stats/global', undefined, []);

  const { data: revenueData } = useFetch<Record<string, number>>('/api/admin/stats/revenue', undefined, []);

  const revenuePoints: RevenuePoint[] = useMemo(() => {
    const source = revenueData ?? stats?.monthlyRevenue;
    if (!source) return [];
    return Object.entries(source)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [revenueData, stats]);

  if (loading && !stats) {
    return <Loader />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <ErrorMessage message={error} />
            <Button onPress={refetch}>Réessayer</Button>
          </Card.Content>
        </Card>
      ) : null}

      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelLarge">Utilisateurs</Text>
            <Text variant="headlineMedium">{stats?.totalUsers ?? 0}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelLarge">Prestataires actifs</Text>
            <Text variant="headlineMedium">{stats?.activeProviders ?? 0}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelLarge">Réservations</Text>
            <Text variant="headlineMedium">{stats?.totalBookings ?? 0}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="labelLarge">Terminé</Text>
            <Text variant="headlineMedium">{stats?.completedBookings ?? 0}</Text>
          </Card.Content>
        </Card>
      </View>

      <ChartView title="Revenus" data={revenuePoints} />

      <Card style={styles.revenueCard}>
        <Card.Title title="Répartition des revenus" subtitle="Montants mensuels" />
        <Card.Content>
          <DataTable<RevenuePoint>
            data={revenuePoints}
            columns={[
              { key: 'month', title: 'Mois' },
              { key: 'value', title: 'Montant', render: (item) => formatCurrency(item.value) },
            ]}
            emptyMessage="Aucune donnée de revenus"
          />
        </Card.Content>
      </Card>

      <Card style={styles.providersCard}>
        <Card.Title title="Top prestataires" />
        <Card.Content>
          <DataTable<TopProvider>
            data={stats?.topProviders ?? []}
            columns={[
              { key: 'name', title: 'Prestataire' },
              { key: 'completed', title: 'Réservations complétées', numeric: true },
            ]}
            emptyMessage="Aucun prestataire"
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 160,
    marginRight: 12,
    marginBottom: 12,
  },
  errorCard: {
    marginBottom: 16,
  },
  revenueCard: {
    marginTop: 12,
  },
  providersCard: {
    marginTop: 12,
  },
});

export default StatsScreen;
