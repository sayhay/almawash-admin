import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../auth/useAuth';
import { useThemeMode } from '../utils/ThemeContext';

interface HeaderProps {
  title: string;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleTheme }) => {
  const { user } = useAuth();
  const { mode } = useThemeMode();

  return (
    <Appbar.Header elevated>
      <Appbar.Content title={title} />
      <Appbar.Action
        icon={(props) => (
          <MaterialCommunityIcons name={mode === 'light' ? 'weather-night' : 'white-balance-sunny'} size={props.size} color={props.color} />
        )}
        onPress={onToggleTheme}
        accessibilityLabel="Basculer le thème"
      />
      <View style={styles.profileContainer}>
        <Avatar.Text size={36} label={user?.email?.slice(0, 2).toUpperCase() ?? 'AD'} />
        <View style={styles.profileText}>
          <Text variant="bodyLarge">{user?.email}</Text>
          <Text variant="labelSmall" style={styles.role}>
            {user?.role}
          </Text>
        </View>
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  profileText: {
    marginLeft: 8,
  },
  role: {
    opacity: 0.7,
  },
});
