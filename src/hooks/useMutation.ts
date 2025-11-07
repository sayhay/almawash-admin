import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';

import { client } from '../api/client';
import type { MutationMethod } from '../utils/types';

interface MutationState<T> {
  loading: boolean;
  error: string | undefined;
  data: T | undefined;
}

export const useMutation = <T, P = unknown>(
  method: MutationMethod = 'post',
  url?: string,
  defaultConfig?: AxiosRequestConfig,
) => {
  const [state, setState] = useState<MutationState<T>>({ loading: false, error: undefined, data: undefined });

  const mutate = useCallback(
    async (payload?: P, config?: AxiosRequestConfig) => {
      if (!url) {
        throw new Error('URL manquante pour la mutation');
      }
      setState({ loading: true, error: undefined, data: undefined });
      try {
        const response = await client.request<T>({
          url,
          method,
          data: payload,
          ...defaultConfig,
          ...config,
        });
        setState({ loading: false, error: undefined, data: response.data });
        return response.data;
      } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Une erreur est survenue';
        setState({ loading: false, error: message, data: undefined });
        throw error;
      }
    },
    [method, url, defaultConfig],
  );

  return { ...state, mutate };
};
