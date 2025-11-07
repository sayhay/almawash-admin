import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, FAB, Portal, Text, TextInput } from 'react-native-paper';

import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { DataTable } from '../components/DataTable';
import { useFetch } from '../hooks/useFetch';
import { useMutation } from '../hooks/useMutation';
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

  const { data, loading, error, refetch } = useFetch<AdminUser[]>(
    '/api/admin/users',
    { params: { role: roleFilter ?? undefined, status: statusFilter ?? undefined } },
    [roleFilter, statusFilter],
  );

  const { mutate: createUser, loading: creating } = useMutation<AdminUser, AdminUserRequest>('post', '/api/admin/users');
  const { mutate: updateUser, loading: updating } = useMutation<AdminUser, AdminUserRequest>('put');
  const { mutate: removeUser } = useMutation<void>('delete');

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    return data.filter((user) => {
      const roleMatch = roleFilter ? user.role === roleFilter : true;
      const statusMatch = statusFilter ? `${user.active ? 'ACTIVE' : 'INACTIVE'}` === statusFilter : true;
      return roleMatch && statusMatch;
    });
  }, [data, roleFilter, statusFilter]);

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
    try {
      if (editing) {
        await updateUser(form, { url: `/api/admin/users/${editing.id}` });
      } else {
        await createUser(form);
      }
      closeModal();
      refetch();
    } catch (err) {
      setErrors({ general: err?.response?.data?.message ?? 'Erreur lors de la sauvegarde' });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await removeUser(undefined, { url: `/api/admin/users/${user.id}` });
      refetch();
    } catch (err) {
      setErrors({ general: err?.response?.data?.message ?? 'Impossible de supprimer cet utilisateur' });
    }
  };

  if (loading && !data) {
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

        {error ? <ErrorMessage message={error} /> : null}

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
            <Button onPress={handleSubmit} loading={creating || updating}>
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => openModal()} loading={creating || updating} />
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
