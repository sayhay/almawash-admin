import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar, useTheme, type MD3Theme } from 'react-native-paper';

import { resetNotificationHandlers, setNotificationHandlers } from './notificationService';

export interface NotificationsContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

type NotificationType = 'error' | 'success' | 'warning';

interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
}

const defaultState: NotificationState = {
  message: '',
  type: 'success',
  visible: false,
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [state, setState] = useState<NotificationState>(defaultState);

  const show = useCallback((message: string, type: NotificationType) => {
    if (!message) {
      return;
    }
    setState({ message, type, visible: true });
  }, []);

  const showError = useCallback((message: string) => show(message, 'error'), [show]);
  const showSuccess = useCallback((message: string) => show(message, 'success'), [show]);
  const showWarning = useCallback((message: string) => show(message, 'warning'), [show]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ showError, showSuccess, showWarning }),
    [showError, showSuccess, showWarning],
  );

  useEffect(() => {
    setNotificationHandlers({ showError, showSuccess, showWarning });
    return () => resetNotificationHandlers();
  }, [showError, showSuccess, showWarning]);

  const onDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Snackbar
        visible={state.visible}
        onDismiss={onDismiss}
        duration={4000}
        style={[styles.base, styles[state.type]]}
      >
        {state.message}
      </Snackbar>
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationsProvider');
  }
  return context;
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    base: {
      margin: 16,
    },
    error: {
      backgroundColor: theme.colors.error,
    },
    success: {
      backgroundColor: theme.colors.primary,
    },
    warning: {
      backgroundColor: theme.colors.secondary ?? theme.colors.tertiary,
    },
  });
