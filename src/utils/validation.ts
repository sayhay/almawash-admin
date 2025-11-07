import { USER_ROLES, USER_STATUSES } from './constants';

export const isEmail = (value: string) => /.+@.+\..+/.test(value);

export interface ValidationErrorMap {
  [key: string]: string | undefined;
}

export const validateUserForm = (data: {
  email: string;
  role: string;
  phone?: string;
  status?: string;
}) => {
  const errors: ValidationErrorMap = {};

  if (!data.email || !isEmail(data.email)) {
    errors.email = 'Email invalide';
  }

  if (!USER_ROLES.includes(data.role as any)) {
    errors.role = 'Rôle invalide';
  }

  if (data.status && !USER_STATUSES.includes(data.status as any)) {
    errors.status = 'Statut invalide';
  }

  return errors;
};

export const validatePasswordChange = (current: string, next: string, confirm: string) => {
  const errors: ValidationErrorMap = {};

  if (!current) {
    errors.currentPassword = 'Mot de passe actuel requis';
  }

  if (!next || next.length < 8) {
    errors.newPassword = '8 caractères minimum';
  }

  if (next !== confirm) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  return errors;
};
