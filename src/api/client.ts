import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { parseAxiosError } from './errors';
import { notificationService } from '../ui/notifications/notificationService';
import {
  API_BASE_URL,
  REFRESH_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '../utils/constants';

export type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | undefined;

export const setUnauthorizedHandler = (handler?: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getTokenFromLocalStorage = () => {
  if (!isBrowser) {
    return null;
  }
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

const removeTokensFromLocalStorage = () => {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    // Ignore localStorage errors silently
  }
};

const clearStoredTokens = async () => {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY]);
  removeTokensFromLocalStorage();
};

const generateRequestId = () => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  const { crypto } = globalThis as { crypto?: { randomUUID?: () => string } };
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return undefined;
};

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

client.interceptors.request.use(async (config) => {
  const storedToken = getTokenFromLocalStorage();
  const token = storedToken ?? (await AsyncStorage.getItem(TOKEN_STORAGE_KEY));

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const requestId = generateRequestId();
  if (requestId) {
    config.headers = {
      ...config.headers,
      'X-Request-Id': requestId,
    };
    (config as Record<string, unknown>).requestId = requestId;
  }

  return config;
});

export default client;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = parseAxiosError(error);
    const status = apiError.status ?? error?.response?.status;

    if (!apiError.requestId) {
      const headerRequestId = error?.response?.headers?.['x-request-id'] as string | undefined;
      const configRequestId = (error?.config as Record<string, unknown> | undefined)?.requestId as string | undefined;
      apiError.requestId = headerRequestId ?? configRequestId ?? apiError.requestId;
    }

    if (status === 401) {
      await clearStoredTokens();
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      if (isBrowser) {
        window.location.assign('/login');
      }
    } else if (status === 403) {
      const message = apiError.message || 'Accès refusé';
      notificationService.showError(message);
    } else if (status === 404) {
      const message = apiError.message || 'Ressource introuvable';
      notificationService.showError(message);
    } else if (status === 409) {
      const message = apiError.message || 'Conflit détecté';
      notificationService.showError(message);
    } else if (status === 400 || status === 422) {
      // Validation errors are handled by the calling components.
    } else if (status && status >= 500) {
      const baseMessage = apiError.message || 'Erreur serveur. Réessayez plus tard.';
      const message = apiError.requestId ? `${baseMessage} (ID: ${apiError.requestId})` : baseMessage;
      notificationService.showError(message);
    } else if (!status) {
      const message = apiError.message || 'Erreur réseau';
      notificationService.showError(message);
    }

    return Promise.reject(apiError);
  },
);
