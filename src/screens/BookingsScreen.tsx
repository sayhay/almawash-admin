import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, SegmentedButtons, Text } from 'react-native-paper';

import { DataTable } from '../components/DataTable';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { useFetch } from '../hooks/useFetch';
import { useMutation } from '../hooks/useMutation';
import { BOOKING_STATUSES } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { BookingItem } from '../utils/types';

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  COMPLETED: 'Terminée',
  DECLINED: 'Refusée',
  CANCELLED: 'Annulée',
};

const BookingsScreen: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const { data, loading, error, refetch } = useFetch<BookingItem[]>(
    '/api/admin/bookings',
    { params: { status: statusFilter ?? undefined } },
    [statusFilter],
  );

  const { mutate: updateBooking, loading: updating } = useMutation<BookingItem, Partial<BookingItem>>('put');
  const { mutate: removeBooking } = useMutation<void>('delete');

  const filtered = useMemo(() => data ?? [], [data]);

  const openStatusDialog = (booking: BookingItem) => {
    setSelected(booking);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setSelected(null);
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    try {
      await updateBooking({ status }, { url: `/api/admin/bookings/${selected.id}` });
      closeDialog();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (booking: BookingItem) => {
    try {
      await removeBooking(undefined, { url: `/api/admin/bookings/${booking.id}` });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium">Filtrer par statut</Text>
        <SegmentedButtons
          value={statusFilter ?? 'ALL'}
          onValueChange={(value) => setStatusFilter(value === 'ALL' ? null : value)}
          buttons={[{ value: 'ALL', label: 'Tous' }, ...BOOKING_STATUSES.map((status) => ({ value: status, label: statusLabels[status] }))]}
          style={styles.segmented}
        />

        {error ? <ErrorMessage message={error} /> : null}

        <DataTable<BookingItem>
          data={filtered}
          columns={[
            { key: 'id', title: '#' },
            { key: 'clientEmail', title: 'Client' },
            { key: 'providerEmail', title: 'Prestataire' },
            { key: 'serviceName', title: 'Service' },
            { key: 'date', title: 'Date', render: (item) => formatDate(item.date) },
            { key: 'price', title: 'Prix', render: (item) => formatCurrency(item.price) },
            { key: 'status', title: 'Statut', render: (item) => statusLabels[item.status] ?? item.status },
          ]}
          actions={(item) => (
            <View style={styles.rowActions}>
              <Button mode="text" compact style={styles.actionButton} onPress={() => openStatusDialog(item)}>
                Statut
              </Button>
              <Button mode="text" compact style={styles.actionButton} onPress={() => handleDelete(item)}>
                Supprimer
              </Button>
            </View>
          )}
          emptyMessage="Aucune réservation"
        />
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Modifier le statut</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={selected?.status ?? 'PENDING'}
              onValueChange={handleStatusChange}
              buttons={BOOKING_STATUSES.map((status) => ({ value: status, label: statusLabels[status] }))}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Fermer</Button>
            <Button onPress={() => selected && handleStatusChange(selected.status)} loading={updating}>
              Appliquer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  segmented: {
    marginVertical: 16,
  },
  rowActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 8,
  },
});

export default BookingsScreen;
