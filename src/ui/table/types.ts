import type React from 'react';

export type GridColumn<T> = {
  field: keyof T | string;
  headerName: string;
  width?: number;
  flex?: number;
  valueGetter?: (value: unknown, row: T) => unknown;
  renderCell?: (params: { row: T; value: unknown }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'right' | 'center';
};

export type ServerPager = {
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
};

export type DataGridXProps<T extends { id: number | string }> = {
  rows: T[];
  columns: GridColumn<T>[];
  rowCount?: number;
  loading?: boolean;
  serverMode?: boolean;
  pagination?: ServerPager;
  onPaginationChange?: (pager: ServerPager) => void;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string | number;
  toolbar?: React.ReactNode;
  emptyText?: string;
};
