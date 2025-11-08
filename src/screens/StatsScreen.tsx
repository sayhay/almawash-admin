import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { ChartView } from '@/components/ChartView';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Loader } from '@/components/Loader';
import { useServerGrid } from '@/hooks/useServerGrid';
import { DataGridX, GridColumn } from '@/ui/table';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrencyEUR } from '@/utils/format';
import type { AdminStatsResponse, RevenuePoint, TopProvider } from '@/utils/types';

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

  const {
    rows: revenueRowsServer,
    rowCount: revenueRowCount,
    loading: revenueLoading,
    paginationModel: revenuePaginationModel,
    sortModel: revenueSortModel,
    setPaginationModel: setRevenuePaginationModel,
    setSortModel: setRevenueSortModel,
  } = useServerGrid<RevenuePoint & { id: string }>({
    endpoint: '/api/admin/stats/revenue',
    initialPageSize: 12,
    mapRow: (item) => {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const month = typeof record.month === 'string' ? record.month : String(record.month ?? record.key ?? '');
        const rawValue = record.value ?? record.amount ?? record.total;
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
        const identifier = (record.id ?? month ?? `${month}-${value}`) as string;
        return {
          month,
          value: Number.isFinite(value) ? value : 0,
          id: identifier || `${month}-${value}`,
        };
      }
      return {
        month: String(item ?? ''),
        value: 0,
        id: String(item ?? ''),
      };
    },
  });

  const revenueRows = useMemo(() => {
    if (revenueRowsServer.length > 0) {
      return revenueRowsServer;
    }
    return revenuePoints.map((point) => ({ ...point, id: point.month }));
  }, [revenuePoints, revenueRowsServer]);

  const revenueRowCountValue = revenueRowsServer.length > 0 ? revenueRowCount : revenueRows.length;
  const revenueServerMode = revenueRowsServer.length > 0;

  const revenueColumns = useMemo<GridColumn<RevenuePoint & { id: string }>[]>(
    () => [
      { field: 'month', headerName: 'Mois', flex: 1 },
      {
        field: 'value',
        headerName: 'Montant',
        width: 160,
        align: 'right',
        renderCell: ({ row }) => formatCurrencyEUR(row.value),
      },
    ],
    [],
  );

  const providerColumns = useMemo<GridColumn<TopProvider & { id: string }>[]>(
    () => [
      { field: 'name', headerName: 'Prestataire', flex: 1 },
      {
        field: 'completed',
        headerName: 'Réservations complétées',
        width: 200,
        align: 'right',
      },
    ],
    [],
  );

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
        <Card.Content style={styles.tableContent}>
          <DataGridX<RevenuePoint & { id: string }>
            rows={revenueRows}
            columns={revenueColumns}
            loading={revenueServerMode ? revenueLoading : revenueLoading && revenueRows.length === 0}
            serverMode={revenueServerMode}
            rowCount={revenueRowCountValue}
            paginationModel={revenueServerMode ? revenuePaginationModel : undefined}
            onPaginationModelChange={revenueServerMode ? setRevenuePaginationModel : undefined}
            sortModel={revenueServerMode ? revenueSortModel : undefined}
            onSortModelChange={revenueServerMode ? setRevenueSortModel : undefined}
            emptyText="Aucune donnée de revenus"
          />
        </Card.Content>
      </Card>

      <Card style={styles.providersCard}>
        <Card.Title title="Top prestataires" />
        <Card.Content style={styles.tableContent}>
          <DataGridX<TopProvider & { id: string }>
            rows={(stats?.topProviders ?? []).map((provider, index) => ({ ...provider, id: `${provider.name}-${index}` }))}
            columns={providerColumns}
            emptyText="Aucun prestataire"
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
  tableContent: {
    minWidth: 0,
    alignSelf: 'stretch',
  },
});

export default StatsScreen;
