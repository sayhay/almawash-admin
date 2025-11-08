import * as React from 'react';

import { parseAxiosError } from '@/api/errors';
import { notificationService } from '@/ui/notifications/notificationService';
import type { ServerPager } from '@/ui/table';

export type UseServerGridParams<TFilter> = {
  fetchPage: (args: {
    page: number;
    pageSize: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    filter?: TFilter;
  }) => Promise<{ rows: any[]; total: number }>;
  initialPageSize?: number;
  initialSearch?: string;
  initialFilter?: TFilter;
};

export type UseServerGridResult<T, TFilter> = {
  rows: T[];
  total: number;
  loading: boolean;
  pagination: ServerPager;
  filter: TFilter;
  setPagination: React.Dispatch<React.SetStateAction<ServerPager>>;
  setFilter: (updater: React.SetStateAction<TFilter>) => void;
  setSearch: (search: string | undefined) => void;
  refresh: () => Promise<void>;
};

export function useServerGrid<T, TFilter = unknown>({
  fetchPage,
  initialPageSize = 10,
  initialSearch,
  initialFilter,
}: UseServerGridParams<TFilter>): UseServerGridResult<T, TFilter | undefined> {
  const [rows, setRows] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState<ServerPager>({
    page: 0,
    pageSize: initialPageSize,
    search: initialSearch,
  });
  const [filter, setFilter] = React.useState<TFilter | undefined>(initialFilter);
  const requestIdRef = React.useRef(0);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const fetchData = React.useCallback(async () => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setLoading(true);
    try {
      const response = await fetchPage({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortField: pagination.sortField,
        sortDirection: pagination.sortDirection,
        search: pagination.search,
        filter,
      });
      if (!isMountedRef.current || requestIdRef.current !== currentRequestId) {
        return;
      }
      setRows(response.rows as T[]);
      setTotal(response.total);
    } catch (error) {
      const apiError = parseAxiosError(error);
      notificationService.showError(apiError.message || 'Erreur lors du chargement des données');
    } finally {
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [fetchPage, filter, pagination.page, pagination.pageSize, pagination.search, pagination.sortDirection, pagination.sortField]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const setSearch = React.useCallback((search: string | undefined) => {
    setPagination((prev) => ({
      ...prev,
      page: 0,
      search: search?.length ? search : undefined,
    }));
  }, []);

  const updateFilter = React.useCallback(
    (updater: React.SetStateAction<TFilter | undefined>) => {
      setFilter((prev) => (typeof updater === 'function' ? (updater as (value: TFilter | undefined) => TFilter | undefined)(prev) : updater));
      setPagination((prev) => ({ ...prev, page: 0 }));
    },
    [],
  );

  const refresh = React.useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    rows,
    total,
    loading,
    pagination,
    filter,
    setPagination,
    setFilter: updateFilter as (updater: React.SetStateAction<TFilter | undefined>) => void,
    setSearch,
    refresh,
  };
}
