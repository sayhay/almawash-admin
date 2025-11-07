import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { useAuth } from '../auth/useAuth';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { DRAWER_WIDTH } from '../utils/constants';
import { useThemeMode } from '../utils/ThemeContext';
import BookingsScreen from '../screens/BookingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import UsersScreen from '../screens/UsersScreen';

const Drawer = createDrawerNavigator();

const screenTitles: Record<string, string> = {
  Dashboard: 'Tableau de bord',
  Users: 'Gestion des utilisateurs',
  Bookings: 'Gestion des réservations',
  Stats: 'Statistiques',
  Notifications: 'Notifications',
  Settings: 'Paramètres',
  Profile: 'Profil administrateur',
};

const AdminNavigator = () => {
  const dimensions = useWindowDimensions();
  const isLargeScreen = dimensions.width >= 900;
  const { logout } = useAuth();
  const { toggle } = useThemeMode();

  return (
    <Drawer.Navigator
      screenOptions={{
        header: ({ route }) => (
          <Header
            title={screenTitles[route.name] ?? route.name}
            onToggleTheme={() => {
              void toggle();
            }}
          />
        ),
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerStyle: isLargeScreen ? { width: DRAWER_WIDTH } : undefined,
      }}
      drawerContent={(props) => <Sidebar {...props} onLogout={logout} />}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: screenTitles.Dashboard }} />
      <Drawer.Screen name="Users" component={UsersScreen} options={{ title: screenTitles.Users }} />
      <Drawer.Screen name="Bookings" component={BookingsScreen} options={{ title: screenTitles.Bookings }} />
      <Drawer.Screen name="Stats" component={StatsScreen} options={{ title: screenTitles.Stats }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: screenTitles.Notifications }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: screenTitles.Settings }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: screenTitles.Profile }} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;
