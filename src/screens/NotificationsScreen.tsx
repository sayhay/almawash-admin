import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
import messaging from '@react-native-firebase/messaging';

import { ErrorMessage } from '../components/ErrorMessage';
import { useFetch } from '../hooks/useFetch';
import { useMutation } from '../hooks/useMutation';
import { client } from '../api/client';
import { getFirebaseApp } from '../firebase/config';
import { formatDate } from '../utils/formatters';
import type { NotificationItem } from '../utils/types';

interface BackendNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const NotificationsScreen: React.FC = () => {
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);
  const { data, loading, error, refetch } = useFetch<BackendNotification[]>(
    '/api/admin/notifications',
    undefined,
    [],
  );
  const { mutate: markAsRead } = useMutation<void>('post');

  useEffect(() => {
    getFirebaseApp();

    const register = async () => {
      try {
        await messaging().requestPermission();
        const token = await messaging().getToken();
        await client.post('/api/users/me/fcm-token', { token });
      } catch (error) {
        console.warn('Impossible de récupérer le token FCM', error);
      }
    };

    register();

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (!remoteMessage?.messageId) return;
      setLocalNotifications((prev) => [
        {
          id: remoteMessage.messageId ?? `${Date.now()}`,
          body: remoteMessage.notification?.body ?? 'Notification reçue',
          title: remoteMessage.notification?.title,
          receivedAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    });

    return unsubscribe;
  }, []);

  const mergedNotifications = useMemo(() => {
    const map = new Map<string, NotificationItem>();
    (data ?? []).forEach((notification) => {
      map.set(notification.id, {
        id: notification.id,
        body: notification.message,
        receivedAt: notification.createdAt,
        read: notification.read,
      });
    });
    localNotifications.forEach((notification) => {
      map.set(notification.id, notification);
    });
    return Array.from(map.values()).sort((a, b) => (a.receivedAt > b.receivedAt ? -1 : 1));
  }, [data, localNotifications]);

  const handleMarkAsRead = async (notification: NotificationItem) => {
    setLocalNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    try {
      await markAsRead(undefined, { url: `/api/admin/notifications/${notification.id}/read` });
      refetch();
    } catch (error) {
      console.warn('Impossible de marquer comme lu', error);
    }
  };

  return (
    <FlatList
      style={styles.list}
      data={mergedNotifications}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      ListHeaderComponent={error ? () => <ErrorMessage message={error} /> : undefined}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>Aucune notification</Text>
          <Button onPress={refetch}>Actualiser</Button>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.card} mode={item.read ? 'outlined' : 'elevated'}>
          <Card.Title title={item.title ?? 'Notification'} subtitle={formatDate(item.receivedAt)} />
          <Card.Content>
            <Text>{item.body}</Text>
          </Card.Content>
          <Card.Actions>
            <IconButton
              icon={item.read ? 'check' : 'email-open'}
              onPress={() => handleMarkAsRead(item)}
              disabled={item.read}
            />
          </Card.Actions>
        </Card>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
