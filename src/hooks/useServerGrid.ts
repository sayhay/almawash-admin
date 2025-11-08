import * as React from 'react';

import client from '@/api/client';
import { parseAxiosError } from '@/api/errors';
import { notificationService } from '@/ui/notifications/notificationService';
import type { GridPaginationModel, GridSortModel } from '@/ui/table';

export type MapParamsArgs<TFilter> = {
  page: number;
  pageSize: number;
  sortModel: GridSortModel;
  search?: string;
  filter?: TFilter;
};

export type UseServerGridParams<T, TFilter> = {
  endpoint: string;
  initialPageSize?: number;
  initialSortModel?: GridSortModel;
  initialFilter?: TFilter;
  initialSearch?: string;
  mapRow?: (item: unknown) => T;
  mapParams?: (args: MapParamsArgs<TFilter>) => Record<string, unknown>;
};

export type UseServerGridResult<T, TFilter> = {
  rows: T[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  search: string;
  filter: TFilter | undefined;
  setPaginationModel: (updater: React.SetStateAction<GridPaginationModel>) => void;
  setSortModel: (updater: React.SetStateAction<GridSortModel>) => void;
  setSearch: (value: string | undefined) => void;
  setFilter: (updater: React.SetStateAction<TFilter | undefined>) => void;
  refresh: () => Promise<void>;
};

type PageResponse<T> = {
  content?: T[];
  totalElements?: number;
  total?: number;
  number?: number;
  size?: number;
  items?: T[];
  data?: T[];
};

const DEFAULT_DEBOUNCE = 300;

const normalizeSortModel = (model?: GridSortModel | null): GridSortModel => {
  if (!model) {
    return [];
  }

  return model
    .filter((item): item is { field: string; sort: 'asc' | 'desc' } =>
      Boolean(item && typeof item.field === 'string' && (item.sort === 'asc' || item.sort === 'desc')),
    )
    .map((item) => ({ field: item.field, sort: item.sort }));
};

const areSortModelsEqual = (a: GridSortModel, b: GridSortModel) => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item.field === b[index]?.field && item.sort === b[index]?.sort);
};

const defaultParamsMapper = <TFilter,>({
  page,
  pageSize,
  sortModel,
  search,
  filter,
}: MapParamsArgs<TFilter>): Record<string, unknown> => {
  const [firstSort] = sortModel;
  const sortParam = firstSort ? `${firstSort.field},${firstSort.sort}` : undefined;
  const filterParams: Record<string, unknown> = {};

  if (filter && typeof filter === 'object') {
    Object.entries(filter as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filterParams[key] = value;
      }
    });
  }

  return {
    page,
    size: pageSize,
    ...(sortParam ? { sort: sortParam } : {}),
    ...(search ? { search } : {}),
    ...filterParams,
  };
};

const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
};

export function useServerGrid<T, TFilter = Record<string, unknown>>({
  endpoint,
  initialPageSize = 10,
  initialSortModel,
  initialFilter,
  initialSearch,
  mapRow,
  mapParams,
}: UseServerGridParams<T, TFilter>): UseServerGridResult<T, TFilter> {
  const [rows, setRows] = React.useState<T[]>([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [paginationModel, setPaginationModelState] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  const [sortModel, setSortModelState] = React.useState<GridSortModel>(() => normalizeSortModel(initialSortModel));
  const [searchValue, setSearchValue] = React.useState(initialSearch ?? '');
  const [filter, setFilterState] = React.useState<TFilter | undefined>(initialFilter);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true);
  const searchRef = React.useRef(initialSearch ?? '');
  const filterRef = React.useRef<TFilter | undefined>(initialFilter);
  const sortModelRef = React.useRef<GridSortModel>(normalizeSortModel(initialSortModel));
  const rowMapperRef = React.useRef<(item: unknown) => T>(mapRow ?? ((item) => item as T));

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  React.useEffect(() => {
    searchRef.current = searchValue;
  }, [searchValue]);

  React.useEffect(() => {
    rowMapperRef.current = mapRow ?? ((item) => item as T);
  }, [mapRow]);

  React.useEffect(() => {
    sortModelRef.current = sortModel;
  }, [sortModel]);

  const paramsMapper = React.useMemo(() => mapParams ?? defaultParamsMapper<TFilter>, [mapParams]);

  const normalizedSearch = searchValue.trim();
  const debouncedSearch = useDebouncedValue(normalizedSearch, DEFAULT_DEBOUNCE);

  const sortKey = React.useMemo(
    () =>
      sortModel
        .map((item) => `${item.field}:${item.sort}`)
        .join('|'),
    [sortModel],
  );

  const filtersKey = React.useMemo(() => {
    if (filter === undefined) {
      return '';
    }
    try {
      return JSON.stringify(filter);
    } catch {
      return String(filter);
    }
  }, [filter]);

  const setPaginationModel = React.useCallback(
    (updater: React.SetStateAction<GridPaginationModel>) => {
      setPaginationModelState((prev) => {
        const nextValue = typeof updater === 'function' ? (updater as (value: GridPaginationModel) => GridPaginationModel)(prev) : updater;
        if (prev.page === nextValue.page && prev.pageSize === nextValue.pageSize) {
          return prev;
        }
        return nextValue;
      });
    },
    [],
  );

  const setSortModel = React.useCallback(
    (updater: React.SetStateAction<GridSortModel>) => {
      setSortModelState((prev) => {
        const nextInput = typeof updater === 'function' ? (updater as (value: GridSortModel) => GridSortModel)(prev) : updater;
        const normalized = normalizeSortModel(nextInput);
        if (areSortModelsEqual(prev, normalized)) {
          return prev;
        }
        setPaginationModelState((current) => (current.page === 0 ? current : { ...current, page: 0 }));
        return normalized;
      });
    },
    [],
  );

  const setSearch = React.useCallback((value?: string) => {
    const next = value ?? '';
    if (searchRef.current === next) {
      return;
    }
    searchRef.current = next;
    setSearchValue(next);
    setPaginationModelState((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, []);

  const setFilter = React.useCallback(
    (updater: React.SetStateAction<TFilter | undefined>) => {
      let changed = false;
      setFilterState((prev) => {
        const nextValue =
          typeof updater === 'function'
            ? (updater as (value: TFilter | undefined) => TFilter | undefined)(prev)
            : updater;

        if (Object.is(prev, nextValue)) {
          return prev;
        }

        if (prev && nextValue && typeof prev === 'object' && typeof nextValue === 'object') {
          try {
            if (JSON.stringify(prev) === JSON.stringify(nextValue)) {
              return prev;
            }
          } catch {
            // ignore serialization errors and treat as changed
          }
        }

        changed = true;
        return nextValue;
      });

      if (changed) {
        setPaginationModelState((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
      }
    },
    [],
  );

  const fetchData = React.useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    const queryParams = paramsMapper({
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortModel: sortModelRef.current,
      search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
      filter: filterRef.current,
    });

    try {
      const response = await client.get<PageResponse<T>>(endpoint, {
        params: queryParams,
        signal: controller.signal,
      });

      if (controller.signal.aborted || !mountedRef.current) {
        return;
      }

      const payload = response.data;
      let content: unknown[] = [];
      let totalFromHeaders: number | undefined;
      const headerTotal = response.headers?.['x-total-count'] as string | undefined;
      if (typeof headerTotal === 'string') {
        const parsed = Number(headerTotal);
        if (!Number.isNaN(parsed)) {
          totalFromHeaders = parsed;
        }
      }

      if (Array.isArray(payload)) {
        content = payload;
      } else if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.content)) {
          content = payload.content;
        } else if (Array.isArray(payload.items)) {
          content = payload.items;
        } else if (Array.isArray(payload.data)) {
          content = payload.data;
        }

        if (typeof payload.totalElements === 'number') {
          totalFromHeaders = payload.totalElements;
        } else if (typeof payload.total === 'number') {
          totalFromHeaders = payload.total;
        }
      }

      const mappedRows = content.map((item) => rowMapperRef.current(item));
      setRows(mappedRows);

      const finalTotal = typeof totalFromHeaders === 'number' && Number.isFinite(totalFromHeaders)
        ? totalFromHeaders
        : mappedRows.length;
      setRowCount(finalTotal);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      if (error instanceof Error && (error.name === 'CanceledError' || error.name === 'AbortError')) {
        return;
      }
      const apiError = parseAxiosError(error);
      notificationService.showError(apiError.message || 'Erreur lors du chargement des données');
    } finally {
      if (!controller.signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, endpoint, filtersKey, paginationModel.page, paginationModel.pageSize, paramsMapper, sortKey]);

  React.useEffect(() => {
    if (!mountedRef.current) {
      return;
    }
    void fetchData();
  }, [fetchData]);

  const refresh = React.useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    rows,
    rowCount,
    loading,
    paginationModel,
    sortModel,
    search: searchValue,
    filter,
    setPaginationModel,
    setSortModel,
    setSearch,
    setFilter,
    refresh,
  };
}
