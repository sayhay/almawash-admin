import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { THEME_STORAGE_KEY } from './constants';
import type { ThemeMode } from './types';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; defaultMode?: ThemeMode }> = ({
  children,
  defaultMode = 'light',
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    };
    load();
  }, []);

  const persist = async (value: ThemeMode) => {
    setModeState(value);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, value);
  };

  const toggle = async () => {
    const next = mode === 'light' ? 'dark' : 'light';
    await persist(next);
  };

  const value = useMemo(
    () => ({
      mode,
      setMode: persist,
      toggle,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode doit être utilisé dans un ThemeProvider');
  }
  return context;
};
