import { useCallback, useState } from 'react';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { ApiError } from '../api/errors';
import { client } from '../api/client';
import type { MutationMethod } from '../utils/types';
import { useApi } from './useApi';

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
  const { run } = useApi();

  const mutate = useCallback(
    async (payload?: P, config?: AxiosRequestConfig) => {
      const requestUrl = config?.url ?? url;
      if (!requestUrl) {
        throw new Error('URL manquante pour la mutation');
      }
      setState({ loading: true, error: undefined, data: undefined });
      try {
        const response = (await run(
          client.request<T>({
            url: requestUrl,
            method,
            data: payload,
            ...defaultConfig,
            ...config,
          }),
        )) as AxiosResponse<T>;
        setState({ loading: false, error: undefined, data: response.data });
        return response.data;
      } catch (error: any) {
        const message = error instanceof ApiError ? error.message : error?.message ?? 'Une erreur est survenue';
        setState({ loading: false, error: message, data: undefined });
        throw error;
      }
    },
    [defaultConfig, method, run, url],
  );

  return { ...state, mutate };
};
