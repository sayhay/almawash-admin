import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';

import { ApiError } from '@/api/errors';
import { useServerGrid } from '@/hooks/useServerGrid';
import { DataGridX, GridColumn } from '@/ui/table';
import { ServerToolbar } from '@/ui/table/ServerToolbar';
import { formatCurrencyEUR, formatDate } from '@/utils/format';
import { BOOKING_STATUSES } from '@/utils/constants';
import type { BookingItem } from '@/utils/types';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Loader } from '@/components/Loader';
import { useMutation } from '@/hooks/useMutation';

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  COMPLETED: 'Terminée',
  DECLINED: 'Refusée',
  CANCELLED: 'Annulée',
};

type BookingsFilter = {
  status?: string;
  providerId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type BookingRow = BookingItem;

const BookingsScreen: React.FC = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [errors, setErrors] = useState<string | undefined>();
  const [providerIdInput, setProviderIdInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');

  const {
    rows,
    rowCount,
    loading,
    paginationModel,
    sortModel,
    search,
    filter,
    setPaginationModel,
    setSortModel,
    setSearch,
    setFilter,
    refresh,
  } = useServerGrid<BookingRow, BookingsFilter>({
    endpoint: '/api/admin/bookings',
    initialPageSize: 10,
    mapParams: ({ page, pageSize, sortModel: currentSort, search: searchQuery, filter: currentFilter }) => {
      const [sort] = currentSort;
      return {
        page,
        size: pageSize,
        sort: sort ? `${sort.field},${sort.sort}` : undefined,
        status: currentFilter?.status,
        providerId: currentFilter?.providerId,
        clientId: currentFilter?.clientId,
        dateFrom: currentFilter?.dateFrom,
        dateTo: currentFilter?.dateTo,
        search: searchQuery,
      };
    },
  });

  const { mutate: updateBooking, loading: updating } = useMutation<BookingItem, Partial<BookingItem>>('put');
  const { mutate: removeBooking } = useMutation<void>('delete');

  useEffect(() => {
    setProviderIdInput(filter?.providerId ?? '');
    setClientIdInput(filter?.clientId ?? '');
    setDateFromInput(filter?.dateFrom ?? '');
    setDateToInput(filter?.dateTo ?? '');
  }, [filter?.clientId, filter?.dateFrom, filter?.dateTo, filter?.providerId]);

  const openStatusDialog = useCallback((booking: BookingItem) => {
    setSelected(booking);
    setErrors(undefined);
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
    setSelected(null);
    setErrors(undefined);
  }, []);

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!selected) return;
      try {
        await updateBooking({ status }, { url: `/api/admin/bookings/${selected.id}` });
        closeDialog();
        await refresh();
      } catch (error) {
        if (error instanceof ApiError) {
          setErrors(error.message);
        } else {
          setErrors('Impossible de mettre à jour la réservation');
        }
      }
    },
    [closeDialog, refresh, selected, updateBooking],
  );

  const handleDelete = useCallback(
    async (booking: BookingItem) => {
      try {
        await removeBooking(undefined, { url: `/api/admin/bookings/${booking.id}` });
        await refresh();
      } catch (error) {
        const apiError = error instanceof ApiError ? error : undefined;
        setErrors(apiError?.message ?? 'Impossible de supprimer cette réservation');
      }
    },
    [refresh, removeBooking],
  );

  const applyAdvancedFilters = useCallback(() => {
    setFilter((prev) => ({
      ...(prev ?? {}),
      providerId: providerIdInput.trim() || undefined,
      clientId: clientIdInput.trim() || undefined,
      dateFrom: dateFromInput.trim() || undefined,
      dateTo: dateToInput.trim() || undefined,
    }));
  }, [clientIdInput, dateFromInput, dateToInput, providerIdInput, setFilter]);

  const columns = useMemo<GridColumn<BookingRow>[]>(
    () => [
      { field: 'id', headerName: '#', width: 80, sortable: true },
      { field: 'clientEmail', headerName: 'Client', flex: 1 },
      { field: 'providerEmail', headerName: 'Prestataire', flex: 1 },
      { field: 'serviceName', headerName: 'Service', flex: 1 },
      {
        field: 'date',
        headerName: 'Date',
        width: 180,
        sortable: true,
        renderCell: ({ row }) => (row.date ? formatDate(row.date) : '—'),
      },
      {
        field: 'price',
        headerName: 'Prix',
        width: 140,
        align: 'right',
        sortable: true,
        renderCell: ({ row }) => formatCurrencyEUR(row.price),
      },
      {
        field: 'status',
        headerName: 'Statut',
        width: 160,
        renderCell: ({ row }) => statusLabels[row.status] ?? row.status,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        sortable: false,
        renderCell: ({ row }) => (
          <View style={styles.rowActions}>
            <Button mode="text" compact style={styles.actionButton} onPress={() => openStatusDialog(row)}>
              Statut
            </Button>
            <Button mode="text" compact onPress={() => handleDelete(row)}>
              Supprimer
            </Button>
          </View>
        ),
      },
    ],
    [handleDelete, openStatusDialog],
  );

  if (loading && rows.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <DataGridX<BookingRow>
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          serverMode
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          emptyText="Aucune réservation"
          toolbar={
            <ServerToolbar
              searchPlaceholder="Rechercher (email, service...)"
              searchValue={search}
              onSearch={(query) => setSearch(query || undefined)}
              filters={[
                {
                  key: 'status',
                  label: 'Statut',
                  value: filter?.status ?? undefined,
                  options: [
                    { label: 'Tous', value: undefined },
                    ...BOOKING_STATUSES.map((status) => ({ label: statusLabels[status] ?? status, value: status })),
                  ],
                  onChange: (value) => {
                    setFilter((prev) => ({ ...(prev ?? {}), status: typeof value === 'string' ? value : undefined }));
                  },
                },
              ]}
              onReset={() => {
                setFilter(() => undefined);
                setSearch(undefined);
                setSortModel([]);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
                setProviderIdInput('');
                setClientIdInput('');
                setDateFromInput('');
                setDateToInput('');
              }}
              actions={
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarActions}>
                  <TextInput
                    mode="outlined"
                    label="Prestataire ID"
                    value={providerIdInput}
                    onChangeText={setProviderIdInput}
                    style={styles.filterInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="Client ID"
                    value={clientIdInput}
                    onChangeText={setClientIdInput}
                    style={styles.filterInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="Date début"
                    placeholder="YYYY-MM-DD"
                    value={dateFromInput}
                    onChangeText={setDateFromInput}
                    style={styles.filterInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="Date fin"
                    placeholder="YYYY-MM-DD"
                    value={dateToInput}
                    onChangeText={setDateToInput}
                    style={styles.filterInput}
                  />
                  <Button mode="contained-tonal" onPress={applyAdvancedFilters}>
                    Appliquer
                  </Button>
                </ScrollView>
              }
            />
          }
        />
      </View>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Modifier le statut</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              {BOOKING_STATUSES.map((status) => (
                <Button
                  key={status}
                  mode={selected?.status === status ? 'contained' : 'outlined'}
                  style={styles.statusButton}
                  onPress={() => handleStatusChange(status)}
                  disabled={updating}
                >
                  {statusLabels[status] ?? status}
                </Button>
              ))}
            </View>
            {errors ? <ErrorMessage message={errors} /> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    minWidth: 0,
    minHeight: 0,
  },
  gridContainer: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    marginRight: 8,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  filterInput: {
    minWidth: 160,
  },
  dialogContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    marginVertical: 4,
  },
});

export default BookingsScreen;
