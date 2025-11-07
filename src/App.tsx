import React from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import AdminNavigator from './navigation/AdminNavigator';
import LoginScreen from './screens/LoginScreen';
import { Loader } from './components/Loader';
import { ThemeProvider, useThemeMode } from './utils/ThemeContext';
import { darkTheme, lightTheme } from './utils/theme';

const AppContent: React.FC = () => {
  const { mode } = useThemeMode();
  const { initialized, hasAdminAccess } = useAuth();

  const paperTheme = mode === 'dark' ? darkTheme : lightTheme;
  const navigationTheme = mode === 'dark'
    ? {
        ...NavigationDarkTheme,
        colors: {
          ...NavigationDarkTheme.colors,
          primary: paperTheme.colors.primary,
          background: paperTheme.colors.background,
          card: paperTheme.colors.surface,
          text: paperTheme.colors.onSurface,
        },
      }
    : {
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          primary: paperTheme.colors.primary,
          background: paperTheme.colors.background,
          card: paperTheme.colors.surface,
          text: paperTheme.colors.onSurface,
        },
      };

  if (!initialized) {
    return <Loader />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme}>{hasAdminAccess ? <AdminNavigator /> : <LoginScreen />}</NavigationContainer>
    </PaperProvider>
  );
};

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider>
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

const App: React.FC = () => (
  <Providers>
    <AppContent />
  </Providers>
);

export default App;
