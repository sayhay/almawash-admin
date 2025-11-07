import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Snackbar, Text, TextInput } from 'react-native-paper';

import { ErrorMessage } from '../components/ErrorMessage';
import { Loader } from '../components/Loader';
import { useFetch } from '../hooks/useFetch';
import { useMutation } from '../hooks/useMutation';
import type { AdminConfigResponse } from '../utils/types';

const SettingsScreen: React.FC = () => {
  const { data, loading, error, refetch } = useFetch<AdminConfigResponse>('/api/admin/config', undefined, []);
  const { mutate: updateConfig, loading: saving } = useMutation<AdminConfigResponse>('put', '/api/admin/config');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateConfig({ settings });
      setSnackbar('Configuration enregistrée');
      refetch();
    } catch (err: any) {
      setSnackbar(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    }
  };

  if (loading && !data) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ErrorMessage message={error} /> : null}
        <Card>
          <Card.Title title="Paramètres généraux" subtitle="Tarifs, zones et horaires" />
          <Card.Content>
            {Object.entries(settings).map(([key, value]) => (
              <View key={key} style={styles.field}>
                <Text variant="labelLarge" style={styles.label}>
                  {key}
                </Text>
                <TextInput value={value} onChangeText={(text) => handleChange(key, text)} mode="outlined" />
              </View>
            ))}
            {!Object.keys(settings).length ? <Text>Aucun paramètre disponible</Text> : null}
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={() => {
                if (data?.settings) {
                  setSettings(data.settings);
                }
              }}
            >
              Annuler
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving}>
              Enregistrer
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
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
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
});

export default SettingsScreen;
