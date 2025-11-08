import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';

import client from '@/api/client';
import { ApiError } from '@/api/errors';
import { useApi } from '@/hooks/useApi';
import { useServerGrid } from '@/hooks/useServerGrid';
import { DataGridX, GridColumn } from '@/ui/table';
import { ServerToolbar } from '@/ui/table/ServerToolbar';
import { formatDate, formatPhone } from '@/utils/format';
import { USER_ROLES, USER_STATUSES } from '@/utils/constants';
import type { AdminUser, AdminUserRequest } from '@/utils/types';
import { ErrorMessage } from '@/components/ErrorMessage';
import { validateUserForm } from '@/utils/validation';

type UsersFilter = {
  role?: string;
  status?: string;
};

type UserRow = AdminUser;

const UsersScreen: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<AdminUserRequest & { active: boolean }>({
    email: '',
    phone: '',
    role: 'PROVIDER',
    active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const { run } = useApi();
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
  } = useServerGrid<UserRow, UsersFilter>({
    endpoint: '/api/admin/users',
    initialPageSize: 10,
    mapParams: ({ page, pageSize, sortModel: currentSort, search: searchQuery, filter: currentFilter }) => {
      const [sort] = currentSort;
      return {
        page,
        size: pageSize,
        sort: sort ? `${sort.field},${sort.sort}` : undefined,
        role: currentFilter?.role,
        status: currentFilter?.status,
        email: searchQuery,
      };
    },
  });

  const openModal = useCallback((user?: AdminUser) => {
    if (user) {
      setForm({ email: user.email, phone: user.phone ?? '', role: user.role, active: user.active ?? true });
      setEditing(user);
    } else {
      setForm({ email: '', phone: '', role: 'PROVIDER', active: true });
      setEditing(null);
    }
    setErrors({});
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const validation = validateUserForm({ ...form, status: form.active ? 'ACTIVE' : 'INACTIVE' });
    if (Object.values(validation).some(Boolean)) {
      setErrors(validation as Record<string, string>);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      if (editing) {
        await run(client.put(`/api/admin/users/${editing.id}`, form));
      } else {
        await run(client.post('/api/admin/users', form));
      }
      closeModal();
      await refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details && Object.keys(error.details).length > 0) {
          setErrors(error.details);
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'Erreur lors de la sauvegarde' });
      }
    } finally {
      setSaving(false);
    }
  }, [closeModal, editing, form, refresh, run]);

  const handleDelete = useCallback(
    async (user: AdminUser) => {
      try {
        await run(client.delete(`/api/admin/users/${user.id}`));
        await refresh();
      } catch (error) {
        if (error instanceof ApiError) {
          setErrors({ general: error.message });
        } else {
          setErrors({ general: 'Impossible de supprimer cet utilisateur' });
        }
      }
    },
    [refresh, run],
  );

  const columns = useMemo<GridColumn<UserRow>[]>(
    () => [
      { field: 'email', headerName: 'Email', flex: 1, sortable: true },
      {
        field: 'phone',
        headerName: 'Téléphone',
        width: 160,
        renderCell: ({ row }) => formatPhone(row.phone),
      },
      { field: 'role', headerName: 'Rôle', width: 140, sortable: true },
      {
        field: 'active',
        headerName: 'Statut',
        width: 140,
        sortable: false,
        renderCell: ({ row }) => (row.active ? 'Actif' : 'Inactif'),
      },
      {
        field: 'createdAt',
        headerName: 'Créé le',
        width: 160,
        sortable: true,
        renderCell: ({ row }) => (row.createdAt ? formatDate(row.createdAt) : '—'),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        sortable: false,
        renderCell: ({ row }) => (
          <View style={styles.rowActions}>
            <Button mode="text" compact style={styles.rowActionButton} onPress={() => openModal(row)}>
              Modifier
            </Button>
            <Button mode="text" compact onPress={() => handleDelete(row)}>
              Supprimer
            </Button>
          </View>
        ),
      },
    ],
    [handleDelete, openModal],
  );

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'role',
        label: 'Rôle',
        value: filter?.role ?? undefined,
        options: [{ label: 'Tous', value: undefined }, ...USER_ROLES.map((role) => ({ label: role, value: role }))],
        onChange: (value: string | number | null | undefined) => {
          setFilter((prev) => ({ ...(prev ?? {}), role: typeof value === 'string' ? value : undefined }));
        },
      },
      {
        key: 'status',
        label: 'Statut',
        value: filter?.status ?? undefined,
        options: [
          { label: 'Tous', value: undefined },
          { label: 'Actif', value: 'ACTIVE' },
          { label: 'Inactif', value: 'INACTIVE' },
        ],
        onChange: (value: string | number | null | undefined) => {
          setFilter((prev) => ({ ...(prev ?? {}), status: typeof value === 'string' ? value : undefined }));
        },
      },
    ],
    [filter?.role, filter?.status, setFilter],
  );

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <DataGridX<UserRow>
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          serverMode
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          emptyText="Aucun utilisateur"
          toolbar={
            <ServerToolbar
              searchPlaceholder="Rechercher un email"
              searchValue={search}
              onSearch={(query) => setSearch(query || undefined)}
              filters={toolbarFilters}
              onReset={() => {
                setFilter(() => undefined);
                setSearch(undefined);
                setSortModel([]);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              actions={
                Platform.OS === 'web' ? (
                  <Button mode="contained" onPress={() => openModal()}>
                    Nouvel utilisateur
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </View>

      <Portal>
        <Dialog visible={visible} onDismiss={closeModal}>
          <Dialog.Title>{editing ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email"
              value={form.email}
              onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              autoCapitalize="none"
            />
            <ErrorMessage message={errors.email} />
            <TextInput
              label="Téléphone"
              value={form.phone}
              onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              style={styles.input}
            />
            <Text variant="labelLarge" style={styles.label}>
              Rôle
            </Text>
            <View style={styles.filterRow}>
              {USER_ROLES.map((role) => (
                <Chip
                  key={role}
                  style={styles.filterChip}
                  selected={form.role === role}
                  onPress={() => setForm((prev) => ({ ...prev, role }))}
                >
                  {role}
                </Chip>
              ))}
            </View>
            <Text variant="labelLarge" style={styles.label}>
              Statut
            </Text>
            <View style={styles.filterRow}>
              {USER_STATUSES.map((status) => (
                <Chip
                  key={status}
                  style={styles.filterChip}
                  selected={(form.active ? 'ACTIVE' : 'INACTIVE') === status}
                  onPress={() => setForm((prev) => ({ ...prev, active: status === 'ACTIVE' }))}
                >
                  {status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                </Chip>
              ))}
            </View>
            <ErrorMessage message={errors.general} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeModal}>Annuler</Button>
            <Button onPress={handleSubmit} loading={saving}>
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {Platform.OS !== 'web' ? <FAB icon="plus" style={styles.fab} onPress={() => openModal()} loading={saving} /> : null}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowActionButton: {
    marginRight: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  input: {
    marginTop: 12,
  },
  label: {
    marginTop: 16,
  },
});

export default UsersScreen;
