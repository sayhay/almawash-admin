import { useCallback } from 'react';
import axios from 'axios';

import { ApiError } from '../api/errors';
import { useNotifications } from '../ui/notifications/NotificationsProvider';

export const useApi = () => {
  const { showError } = useNotifications();

  const run = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      try {
        return await promise;
      } catch (error) {
        if (axios.isCancel?.(error)) {
          throw error;
        }

        if (error instanceof ApiError) {
          if (error.details && Object.keys(error.details).length > 0) {
            throw error;
          }
          const message = error.message || 'Une erreur est survenue';
          showError(message);
          throw error;
        }

        showError('Erreur réseau');
        throw error;
      }
    },
    [showError],
  );

  return { run };
};
