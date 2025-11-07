import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';

import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { DataTable } from '../components/DataTable';
import { useApi } from '../hooks/useApi';
import { client } from '../api/client';
import { ApiError } from '../api/errors';
import { formatDate } from '../utils/formatters';
import { USER_ROLES, USER_STATUSES } from '../utils/constants';
import type { AdminUser, AdminUserRequest } from '../utils/types';
import { validateUserForm } from '../utils/validation';

const UsersScreen: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<AdminUserRequest>({ email: '', phone: '', role: 'PROVIDER', active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const { run } = useApi();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(undefined);
    try {
      const response = await run(
        client.get<AdminUser[]>('/api/admin/users', {
          params: {
            role: roleFilter ?? undefined,
            status: statusFilter ?? undefined,
          },
        }),
      );
      setUsers(response.data ?? []);
    } catch (error) {
      if (error instanceof ApiError) {
        setFetchError(error.message);
      } else {
        setFetchError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  }, [roleFilter, run, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      const roleMatch = roleFilter ? user.role === roleFilter : true;
      const statusMatch = statusFilter ? `${user.active ? 'ACTIVE' : 'INACTIVE'}` === statusFilter : true;
      return roleMatch && statusMatch;
    });
  }, [users, roleFilter, statusFilter]);

  const openModal = (user?: AdminUser) => {
    if (user) {
      setForm({ email: user.email, phone: user.phone, role: user.role, active: user.active ?? true });
      setEditing(user);
    } else {
      setForm({ email: '', phone: '', role: 'PROVIDER', active: true });
      setEditing(null);
    }
    setErrors({});
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const handleSubmit = async () => {
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
      await fetchUsers();
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
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await run(client.delete(`/api/admin/users/${user.id}`));
      await fetchUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Impossible de supprimer cet utilisateur' });
      }
    }
  };

  if (loading && users.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.filters}>
          <Text variant="titleMedium">Filtres</Text>
          <View style={styles.filterRow}>
            {USER_ROLES.map((role) => (
              <Chip
                key={role}
                style={styles.filterChip}
                selected={roleFilter === role}
                onPress={() => setRoleFilter(roleFilter === role ? null : role)}
              >
                {role}
              </Chip>
            ))}
          </View>
          <View style={styles.filterRow}>
            {USER_STATUSES.map((status) => (
              <Chip
                key={status}
                style={styles.filterChip}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(statusFilter === status ? null : status)}
              >
                {status === 'ACTIVE' ? 'Actif' : 'Inactif'}
              </Chip>
            ))}
          </View>
        </View>

        {fetchError ? <ErrorMessage message={fetchError} /> : null}

        <DataTable<AdminUser>
          data={filteredUsers}
          columns={[
            { key: 'email', title: 'Email' },
            { key: 'phone', title: 'Téléphone' },
            { key: 'role', title: 'Rôle' },
            {
              key: 'active',
              title: 'Statut',
              render: (user) => (user.active ? 'Actif' : 'Inactif'),
            },
            {
              key: 'createdAt',
              title: 'Créé le',
              render: (user) => formatDate(user.createdAt),
            },
          ]}
          actions={(user) => (
            <View style={styles.rowActions}>
              <Button mode="text" compact style={styles.rowActionButton} onPress={() => openModal(user)}>
                Modifier
              </Button>
              <Button mode="text" compact style={styles.rowActionButton} onPress={() => handleDelete(user)}>
                Supprimer
              </Button>
            </View>
          )}
          emptyMessage="Aucun utilisateur"
        />
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={closeModal}>
          <Dialog.Title>{editing ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Email" value={form.email} onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))} />
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

      <FAB icon="plus" style={styles.fab} onPress={() => openModal()} loading={saving} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filters: {
    marginBottom: 16,
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
