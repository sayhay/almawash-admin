import { BookingStatus, UserRole } from './constants';

export interface AdminUser {
  id: number;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  active?: boolean;
}

export interface AdminUserRequest {
  email: string;
  phone?: string;
  role: UserRole;
  active?: boolean;
}

export interface BookingItem {
  id: number;
  clientEmail?: string;
  providerEmail?: string;
  serviceName?: string;
  price?: number;
  status: BookingStatus;
  date?: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeProviders: number;
  totalBookings: number;
  completedBookings: number;
  monthlyRevenue: Record<string, number>;
  topProviders: TopProvider[];
}

export interface TopProvider {
  name: string;
  completed: number;
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface AdminConfigResponse {
  settings: Record<string, string>;
}

export interface NotificationItem {
  id: string;
  title?: string;
  body: string;
  receivedAt: string;
  read: boolean;
}

export interface AuthUser {
  userId: number;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface UserProfile {
  id: number;
  email: string;
  phone?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface Pageable<T> {
  content: T[];
  totalElements: number;
}

export type MutationMethod = 'post' | 'put' | 'delete' | 'patch';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordUpdatePayload {
  currentPassword: string;
  newPassword: string;
}

export type ThemeMode = 'light' | 'dark';
