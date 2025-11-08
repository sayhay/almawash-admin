import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';

import { ChartView } from '@/components/ChartView';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Loader } from '@/components/Loader';
import { useServerGrid } from '@/hooks/useServerGrid';
import { DataGridX, GridColumn } from '@/ui/table';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrencyEUR } from '@/utils/format';
import type { AdminStatsResponse, RevenuePoint, TopProvider } from '@/utils/types';
import type { AppTheme } from '@/theme';
import { Box } from '@/theme';
import { Section } from '@/ui/Section';
import { Surface } from '@/ui/Surface';
import { StatCard } from '@/ui/StatCard';
import { PrimaryButton } from '@/ui/PrimaryButton';

const StatsScreen: React.FC = () => {
  const theme = useTheme<AppTheme>();
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

  const summaryCards = useMemo(
    () => [
      {
        key: 'users',
        label: 'Utilisateurs',
        value: stats?.totalUsers ?? 0,
        icon: (
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.info} />
        ),
        tone: 'info' as const,
      },
      {
        key: 'providers',
        label: 'Prestataires actifs',
        value: stats?.activeProviders ?? 0,
        icon: (
          <MaterialCommunityIcons name="briefcase-check" size={24} color={theme.colors.success} />
        ),
        tone: 'success' as const,
      },
      {
        key: 'bookings',
        label: 'Réservations',
        value: stats?.totalBookings ?? 0,
        icon: (
          <MaterialCommunityIcons name="calendar-month" size={24} color={theme.colors.warning} />
        ),
        tone: 'warning' as const,
      },
      {
        key: 'completed',
        label: 'Terminées',
        value: stats?.completedBookings ?? 0,
        icon: (
          <MaterialCommunityIcons name="check-decagram" size={24} color={theme.colors.success} />
        ),
        tone: 'success' as const,
      },
    ],
    [stats, theme.colors.info, theme.colors.success, theme.colors.warning],
  );

  const contentPadding = theme.spacing.lg;
  const backgroundColor = theme.colors.background;

  if (loading && !stats) {
    return <Loader />;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { padding: contentPadding }]}
      style={{ backgroundColor }}
    >
      {error ? (
        <Surface marginBottom="xl">
          <ErrorMessage message={error} />
          <Box marginTop="md">
            <PrimaryButton label="Réessayer" onPress={refetch} />
          </Box>
        </Surface>
      ) : null}

      <Section
        title="Indicateurs clés"
        subtitle="Vue d'ensemble de l'activité Almawash"
      >
        <Box style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <Box key={card.key} style={styles.summaryItem}>
              <StatCard icon={card.icon} label={card.label} value={card.value} tone={card.tone} />
            </Box>
          ))}
        </Box>
      </Section>

      <ChartView title="Revenus" data={revenuePoints} />

      <Section title="Répartition des revenus" subtitle="Montants mensuels">
        <Box style={styles.tableContainer}>
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
        </Box>
      </Section>

      <Section title="Top prestataires" subtitle="Classement par réservations complétées">
        <Box style={styles.tableContainer}>
          <DataGridX<TopProvider & { id: string }>
            rows={(stats?.topProviders ?? []).map((provider, index) => ({ ...provider, id: `${provider.name}-${index}` }))}
            columns={providerColumns}
            emptyText="Aucun prestataire"
          />
        </Box>
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 160,
  },
  tableContainer: {
    minWidth: 0,
  },
});

export default StatsScreen;
