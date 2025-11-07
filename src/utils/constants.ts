import Constants from 'expo-constants';

export const API_BASE_URL =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  'http://localhost:8080';

export const PAGE_SIZE = 10;

export const USER_ROLES = ['ADMIN', 'PROVIDER', 'CLIENT'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'CANCELLED'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const THEME_STORAGE_KEY = 'almawash-theme';
export const TOKEN_STORAGE_KEY = 'almawash-token';
export const REFRESH_TOKEN_STORAGE_KEY = 'almawash-refresh-token';

export const DRAWER_WIDTH = 300;
