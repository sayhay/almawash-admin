import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { ApiError } from '../api/errors';
import { client } from '../api/client';
import { useApi } from './useApi';

interface FetchState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
}

export const useFetch = <T>(
  url: string,
  options?: AxiosRequestConfig,
  deps: unknown[] = [],
) => {
  const [state, setState] = useState<FetchState<T>>({ data: undefined, loading: false, error: undefined });
  const abortController = useRef<AbortController | null>(null);
  const { run } = useApi();

  const fetchData = useCallback(async () => {
    if (!url) {
      return;
    }
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const response = (await run(
        client.get<T>(url, {
          signal: controller.signal,
          ...options,
        }),
      )) as AxiosResponse<T>;
      setState({ data: response.data, loading: false, error: undefined });
    } catch (error: any) {
      if (axios.isCancel?.(error)) {
        return;
      }
      if (error instanceof ApiError) {
        setState({ data: undefined, loading: false, error: error.message });
        return;
      }
      const message = error?.message ?? 'Une erreur est survenue';
      setState({ data: undefined, loading: false, error: message });
    }
  }, [run, url, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    return () => {
      abortController.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refetch: fetchData,
  };
};
