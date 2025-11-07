import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../auth/useAuth';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { useFetch } from '../hooks/useFetch';
import { useMutation } from '../hooks/useMutation';
import { useThemeMode } from '../utils/ThemeContext';
import type { PasswordUpdatePayload, UserProfile } from '../utils/types';
import { validatePasswordChange } from '../utils/validation';


const ProfileScreen: React.FC = () => {
  const { user, setUser } = useAuth();
  const { mode, toggle } = useThemeMode();
  const { data, loading, refetch } = useFetch<UserProfile>('/api/auth/me', undefined, []);
  const { mutate: updatePassword, loading: saving } = useMutation<void, PasswordUpdatePayload>('put', '/api/users/me/password');
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const validation = validatePasswordChange(form.currentPassword, form.newPassword, form.confirmPassword);
    if (Object.values(validation).some(Boolean)) {
      setErrors(validation as Record<string, string>);
      return;
    }
    setErrors({});
    try {
      await updatePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setFeedback('Mot de passe mis à jour');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setFeedback(error?.response?.data?.message ?? 'Erreur lors de la mise à jour');
    }
  };

  if (loading && !data) {
    return <Loader />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Profil administrateur" />
        <Card.Content>
          <Text variant="labelLarge" style={styles.label}>
            Email
          </Text>
          <Text>{user?.email}</Text>
          <Text variant="labelLarge" style={styles.label}>
            Téléphone
          </Text>
          <Text>{user?.phone ?? '—'}</Text>
          <Text variant="labelLarge" style={styles.label}>
            Rôle
          </Text>
          <Text>{user?.role}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={refetch}>Actualiser</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Sécurité" />
        <Card.Content>
          <TextInput
            label="Mot de passe actuel"
            value={form.currentPassword}
            onChangeText={(text) => handleChange('currentPassword', text)}
            secureTextEntry
            style={styles.input}
          />
          <ErrorMessage message={errors.currentPassword} />
          <TextInput
            label="Nouveau mot de passe"
            value={form.newPassword}
            onChangeText={(text) => handleChange('newPassword', text)}
            secureTextEntry
            style={styles.input}
          />
          <ErrorMessage message={errors.newPassword} />
          <TextInput
            label="Confirmer"
            value={form.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
            style={styles.input}
          />
          <ErrorMessage message={errors.confirmPassword} />
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleSubmit} loading={saving} mode="contained">
            Mettre à jour
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Apparence" />
        <Card.Content>
          <View style={styles.themeRow}>
            <Text>Thème sombre</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={() => {
                void toggle();
              }}
            />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
  },
  input: {
    marginTop: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedback: {
    marginTop: 8,
  },
});

export default ProfileScreen;
