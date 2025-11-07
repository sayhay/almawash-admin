import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { Divider, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../auth/useAuth';

type SidebarProps = DrawerContentComponentProps & {
  onLogout: () => void;
};

const MENU_ITEMS = [
  { label: 'Tableau de bord', icon: 'view-dashboard', route: 'Dashboard' },
  { label: 'Utilisateurs', icon: 'account-group', route: 'Users' },
  { label: 'Réservations', icon: 'calendar-check', route: 'Bookings' },
  { label: 'Statistiques', icon: 'chart-line', route: 'Stats' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications' },
  { label: 'Paramètres', icon: 'cog', route: 'Settings' },
  { label: 'Profil', icon: 'account-circle', route: 'Profile' },
];

export const Sidebar: React.FC<SidebarProps> = ({ navigation, state, onLogout }) => {
  const { user } = useAuth();

  return (
    <DrawerContentScrollView>
      <View style={styles.header}>
        <Text variant="titleLarge">Alma Wash</Text>
        <Text variant="bodySmall" style={styles.email}>
          {user?.email}
        </Text>
      </View>
      <Divider />
      {MENU_ITEMS.map((item) => {
        const focused = state.routeNames[state.index] === item.route;
        return (
          <DrawerItem
            key={item.route}
            label={item.label}
            icon={({ color, size }) => <MaterialCommunityIcons name={item.icon} color={color} size={size} />}
            focused={focused}
            onPress={() => navigation.navigate(item.route as never)}
          />
        );
      })}
      <Divider style={styles.divider} />
      <DrawerItem
        label="Déconnexion"
        icon={({ color, size }) => <MaterialCommunityIcons name="logout" color={color} size={size} />}
        onPress={onLogout}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
  },
  email: {
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    marginTop: 12,
  },
});
