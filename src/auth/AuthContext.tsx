import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { client, setUnauthorizedHandler } from '../api/client';
import {
  REFRESH_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  USER_ROLES,
} from '../utils/constants';
import type {
  AuthUser,
  LoginCredentials,
  UserProfile,
} from '../utils/types';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  initialized: boolean;
  hasAdminAccess: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeUser = (payload: any): UserProfile => ({
  id: payload?.id ?? payload?.userId ?? 0,
  email: payload?.email ?? '',
  phone: payload?.phone ?? undefined,
  role: USER_ROLES.includes(payload?.role) ? payload.role : 'CLIENT',
  firstName: payload?.firstName ?? undefined,
  lastName: payload?.lastName ?? undefined,
  avatarUrl: payload?.avatarUrl ?? undefined,
  createdAt: payload?.createdAt ?? undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY]);
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await client.get<UserProfile>('/api/users/me');
      const profile = normalizeUser(data);
      setUser(profile);
      return profile;
    } catch (error) {
      const { data } = await client.get<AuthUser>('/api/auth/me');
      const profile = normalizeUser({ ...data, id: data.userId });
      setUser(profile);
      return profile;
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        const profile = await fetchProfile();
        if (profile.role !== 'ADMIN') {
          await clearSession();
        }
      }
    } catch (error) {
      await clearSession();
    } finally {
      setInitialized(true);
    }
  }, [clearSession, fetchProfile]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      try {
        const { data } = await client.post('/api/auth/login', credentials);
        const jwt = data?.jwt ?? data?.token;
        const refresh = data?.refreshToken;
        if (!jwt) {
          throw new Error("Le token d'authentification est manquant");
        }
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, jwt);
        if (refresh) {
          await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh);
        }
        try {
          const profile = await fetchProfile();
          if (profile.role !== 'ADMIN') {
            await clearSession();
            throw new Error('Accès réservé aux administrateurs');
          }
        } catch (error) {
          const fallback = normalizeUser(data);
          setUser(fallback);
          if (fallback.role !== 'ADMIN') {
            await clearSession();
            throw error ?? new Error('Accès refusé');
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile],
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshToken = useCallback(async () => {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!refresh) return;
    setIsRefreshing(true);
    try {
      const { data } = await client.post('/api/auth/refresh', { refreshToken: refresh });
      const newToken = data?.jwt ?? data?.token;
      const newRefresh = data?.refreshToken ?? refresh;
      if (newToken) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      }
      if (newRefresh) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefresh);
      }
    } catch (error) {
      await clearSession();
    } finally {
      setIsRefreshing(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    loadSession();

    return () => setUnauthorizedHandler(undefined);
  }, [clearSession, loadSession]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      isRefreshing,
      initialized,
      hasAdminAccess: user?.role === 'ADMIN',
      login,
      logout,
      refreshToken,
    }),
    [initialized, isLoading, isRefreshing, login, logout, refreshToken, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext doit être utilisé dans un AuthProvider');
  }
  return context;
};
