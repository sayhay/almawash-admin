import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, FAB, Portal, Text as PaperText, TextInput } from 'react-native-paper';

import client from '@/api/client';
import { ApiError } from '@/api/errors';
import { useApi } from '@/hooks/useApi';
import { MapParamsArgs, useServerGrid } from '@/hooks/useServerGrid';
import { DataGridX, GridColumn } from '@/ui/table';
import { ServerToolbar } from '@/ui/table/ServerToolbar';
import { formatDate, formatPhone } from '@/utils/format';
import { USER_ROLES, USER_STATUSES } from '@/utils/constants';
import type { AdminUser, AdminUserRequest } from '@/utils/types';
import { ErrorMessage } from '@/components/ErrorMessage';
import { validateUserForm } from '@/utils/validation';
import { Box } from '@/theme';
import { Section } from '@/ui/Section';
import { PrimaryButton } from '@/ui/PrimaryButton';

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
  const mapUsersParams = useCallback(
    ({ page, pageSize, sortModel: currentSort, search: searchQuery, filter: currentFilter }: MapParamsArgs<UsersFilter>) => {
      const [sort] = currentSort;
      return {
        page,
        size: pageSize,
        ...(sort ? { sort: `${sort.field},${sort.sort}` } : {}),
        ...(currentFilter?.role ? { role: currentFilter.role } : {}),
        ...(currentFilter?.status ? { status: currentFilter.status } : {}),
        ...(searchQuery ? { email: searchQuery } : {}),
      };
    },
    [],
  );

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
    mapParams: mapUsersParams,
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

  const handleExport = useCallback(() => {
    // TODO: brancher l'export CSV sur l'endpoint d'administration dès qu'il sera disponible
  }, []);

  return (
    <Box flex={1} padding="lg" backgroundColor="background">
      <Section
        title="Utilisateurs"
        subtitle="Gérez les comptes et les statuts des membres Almawash"
        actions={
          <Box style={styles.sectionActions}>
            <Button mode="outlined" onPress={handleExport} icon="download">
              Export CSV
            </Button>
            {Platform.OS === 'web' ? (
              <PrimaryButton label="Nouvel utilisateur" onPress={() => openModal()} />
            ) : null}
          </Box>
        }
      >
        <Box marginBottom="md">
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
          />
        </Box>
        <Box style={styles.gridContainer}>
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
          />
        </Box>
      </Section>

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
            <PaperText variant="labelLarge" style={styles.label}>
              Rôle
            </PaperText>
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
            <PaperText variant="labelLarge" style={styles.label}>
              Statut
            </PaperText>
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
    </Box>
  );
};

const styles = StyleSheet.create({
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
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default UsersScreen;
