import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { DataTable } from '../components/DataTable';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { StatCard } from '../components/StatCard';
import { ChartView } from '../components/ChartView';
import { useFetch } from '../hooks/useFetch';
import type { AdminStatsResponse, RevenuePoint, TopProvider } from '../utils/types';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { data, loading, error, refetch } = useFetch<AdminStatsResponse>(
    '/api/admin/stats/global',
    undefined,
    [],
  );

  const revenuePoints: RevenuePoint[] = useMemo(() => {
    if (!data?.monthlyRevenue) return [];
    return Object.entries(data.monthlyRevenue)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  if (loading && !data) {
    return <Loader />;
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <ErrorMessage message={error} />
        <Button mode="contained" onPress={refetch} style={styles.retry}>
          Réessayer
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <StatCard label="Utilisateurs" value={data?.totalUsers ?? 0} icon="account-group" />
        <StatCard label="Prestataires actifs" value={data?.activeProviders ?? 0} icon="account-cog" />
        <StatCard label="Réservations" value={data?.totalBookings ?? 0} icon="calendar" />
        <StatCard label="Réservations terminées" value={data?.completedBookings ?? 0} icon="check-circle" />
      </View>

      <ChartView title="Revenus mensuels" data={revenuePoints} />

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium">Top prestataires</Text>
        <Button onPress={() => navigation.navigate('Bookings')}>Voir les réservations</Button>
      </View>

      <DataTable<TopProvider>
        data={data?.topProviders ?? []}
        columns={[
          { key: 'name', title: 'Prestataire' },
          { key: 'completed', title: 'Réservations terminées', numeric: true },
        ]}
        emptyMessage="Aucun prestataire disponible"
      />

      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="account-group"
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Users')}
        >
          Gérer les utilisateurs
        </Button>
        <Button
          mode="contained"
          icon="calendar-check"
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Bookings')}
        >
          Gérer les réservations
        </Button>
        <Button
          mode="outlined"
          icon="bell"
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          Notifications
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActions: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    marginRight: 12,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  retry: {
    marginTop: 12,
  },
});

export default DashboardScreen;
