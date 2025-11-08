import React, { useMemo } from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';

import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import AdminNavigator from './navigation/AdminNavigator';
import LoginScreen from './screens/LoginScreen';
import { Loader } from './components/Loader';
import { ThemeProvider, useThemeMode } from './utils/ThemeContext';
import { darkTheme, lightTheme } from './utils/theme';
import { NotificationsProvider } from './ui/notifications/NotificationsProvider';
import ErrorBoundary from './ui/ErrorBoundary';
import { getThemeByMode } from './theme';
import type { AppTheme } from './theme';
import type { Theme as MuiTheme } from '@mui/material/styles';

const AppContent: React.FC = () => {
  const { mode } = useThemeMode();
  const { initialized, hasAdminAccess } = useAuth();

  const restyleTheme = useMemo<AppTheme>(() => getThemeByMode(mode), [mode]);
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

  const muiTheme = useMemo<MuiTheme | undefined>(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    const { createMuiThemeFromAppTheme } = require('./theme/mui') as typeof import('./theme/mui');
    return createMuiThemeFromAppTheme(mode, restyleTheme);
  }, [mode, restyleTheme]);

  if (!initialized) {
    return <Loader />;
  }

  return (
    <RestyleThemeProvider theme={restyleTheme}>
      <PaperProvider theme={paperTheme}>
        <MuiThemeBridge theme={muiTheme}>
          <NotificationsProvider>
            <NavigationContainer theme={navigationTheme}>
              {hasAdminAccess ? <AdminNavigator /> : <LoginScreen />}
            </NavigationContainer>
          </NotificationsProvider>
        </MuiThemeBridge>
      </PaperProvider>
    </RestyleThemeProvider>
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
  <ErrorBoundary>
    <Providers>
      <AppContent />
    </Providers>
  </ErrorBoundary>
);

const MuiThemeBridge: React.FC<{ theme?: MuiTheme }> = ({ theme, children }) => {
  if (Platform.OS !== 'web' || !theme) {
    return <>{children}</>;
  }

  const { ThemeProvider: MuiThemeProvider } = require('@mui/material/styles') as typeof import('@mui/material/styles');

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};

export default App;
