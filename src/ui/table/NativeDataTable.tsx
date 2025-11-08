import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, DataTable as PaperDataTable, Text } from 'react-native-paper';

import type { DataGridXProps, GridColumn, ServerPager } from './types';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type NativeDataTableProps<T extends { id: number | string }> = DataGridXProps<T>;

type SortState = { field?: string; direction?: 'asc' | 'desc' };

const getCellValue = <T extends { id: number | string }>(row: T, column: GridColumn<T>) => {
  const rawValue = (row as Record<string, unknown>)[column.field as keyof T];
  if (column.valueGetter) {
    return column.valueGetter(rawValue, row);
  }
  return rawValue;
};

const compareValues = (a: unknown, b: unknown) => {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b));
};

export const NativeDataTable = <T extends { id: number | string }>({
  rows,
  columns,
  rowCount,
  loading = false,
  serverMode = false,
  pagination,
  onPaginationChange,
  onRowClick,
  getRowId = (row: T) => row.id,
  toolbar,
  emptyText = 'Aucune donnée',
}: NativeDataTableProps<T>) => {
  const isControlled = Boolean(serverMode && pagination);
  const [localPager, setLocalPager] = React.useState<ServerPager>({
    page: 0,
    pageSize: pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
  });

  const effectivePager = isControlled ? (pagination as ServerPager) : localPager;

  React.useEffect(() => {
    if (serverMode && pagination) {
      setLocalPager({ ...pagination });
    }
  }, [pagination, serverMode]);

  const [sortState, setSortState] = React.useState<SortState>({
    field: pagination?.sortField,
    direction: pagination?.sortDirection,
  });

  React.useEffect(() => {
    if (serverMode && pagination) {
      setSortState({ field: pagination.sortField, direction: pagination.sortDirection });
    }
  }, [pagination?.sortDirection, pagination?.sortField, serverMode]);

  const sortedRows = React.useMemo(() => {
    if (serverMode) {
      return rows;
    }

    if (!sortState.field) {
      return rows;
    }

    const column = columns.find((col) => String(col.field) === sortState.field);
    if (!column) {
      return rows;
    }

    const sorted = [...rows].sort((a, b) => {
      const left = getCellValue(a, column);
      const right = getCellValue(b, column);
      return compareValues(left, right);
    });

    if (sortState.direction === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [columns, rows, serverMode, sortState.direction, sortState.field]);

  const paginatedRows = React.useMemo(() => {
    if (serverMode) {
      return rows;
    }

    const start = effectivePager.page * effectivePager.pageSize;
    return sortedRows.slice(start, start + effectivePager.pageSize);
  }, [effectivePager.page, effectivePager.pageSize, rows, serverMode, sortedRows]);

  const totalItems = serverMode ? rowCount ?? rows.length : rows.length;
  const numberOfPages = Math.max(1, Math.ceil(totalItems / effectivePager.pageSize));

  const handleChangePage = (page: number) => {
    if (serverMode && onPaginationChange && pagination) {
      onPaginationChange({ ...pagination, page });
    } else {
      setLocalPager((prev) => ({ ...prev, page }));
    }
  };

  const handleChangePageSize = (pageSize: number) => {
    if (serverMode && onPaginationChange && pagination) {
      onPaginationChange({ ...pagination, page: 0, pageSize });
    } else {
      setLocalPager({ page: 0, pageSize });
    }
  };

  const handleSort = (column: GridColumn<T>) => {
    if (column.sortable === false) {
      return;
    }

    const field = String(column.field);
    const isSameField = sortState.field === field;
    const nextDirection: 'asc' | 'desc' | undefined = isSameField && sortState.direction === 'asc' ? 'desc' : 'asc';

    if (serverMode && onPaginationChange && pagination) {
      onPaginationChange({
        ...pagination,
        page: 0,
        sortField: field,
        sortDirection: nextDirection,
      });
    } else {
      setSortState({ field, direction: nextDirection });
    }
  };

  const renderedRows = serverMode ? rows : paginatedRows;

  return (
    <View>
      {toolbar ? <View style={styles.toolbarContainer}>{toolbar}</View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <PaperDataTable style={styles.table}>
          <PaperDataTable.Header>
            {columns.map((column) => {
              const isSorted = sortState.field === String(column.field);
              const icon = isSorted ? (sortState.direction === 'desc' ? 'arrow-down' : 'arrow-up') : undefined;

              return (
                <PaperDataTable.Title
                  key={String(column.field)}
                  numeric={column.align === 'right'}
                  style={[styles.headerCell, column.width ? { width: column.width } : undefined]}
                  onPress={() => handleSort(column)}
                >
                  <View style={styles.headerContent}>
                    <Text variant="labelMedium">{column.headerName}</Text>
                    {icon ? <Text style={styles.sortIcon}>{icon === 'arrow-down' ? '↓' : '↑'}</Text> : null}
                  </View>
                </PaperDataTable.Title>
              );
            })}
          </PaperDataTable.Header>

          {!loading && renderedRows.length === 0 ? (
            <PaperDataTable.Row>
              <PaperDataTable.Cell style={[styles.cell, styles.emptyCell, { flex: columns.length }]}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </PaperDataTable.Cell>
            </PaperDataTable.Row>
          ) : null}

          {!loading
            ? renderedRows.map((row) => (
                <PaperDataTable.Row key={String(getRowId(row))} onPress={onRowClick ? () => onRowClick(row) : undefined}>
                  {columns.map((column) => (
                    <PaperDataTable.Cell
                      key={String(column.field)}
                      style={[styles.cell, column.width ? { width: column.width } : undefined]}
                      numeric={column.align === 'right'}
                    >
                      {column.renderCell
                        ? column.renderCell({ row, value: getCellValue(row, column) })
                        : (getCellValue(row, column) as React.ReactNode)}
                    </PaperDataTable.Cell>
                  ))}
                </PaperDataTable.Row>
              ))
            : null}
        </PaperDataTable>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      ) : null}

      {totalItems > effectivePager.pageSize ? (
        <PaperDataTable.Pagination
          page={effectivePager.page}
          numberOfPages={numberOfPages}
          onPageChange={handleChangePage}
          label={`${Math.min(totalItems, effectivePager.page * effectivePager.pageSize + 1)}-${Math.min(
            totalItems,
            (effectivePager.page + 1) * effectivePager.pageSize,
          )} sur ${totalItems}`}
          numberOfItemsPerPage={effectivePager.pageSize}
          showFastPaginationControls
          numberOfItemsPerPageList={PAGE_SIZE_OPTIONS}
          onItemsPerPageChange={handleChangePageSize}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    paddingBottom: 8,
  },
  table: {
    minWidth: '100%',
  },
  headerCell: {
    justifyContent: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortIcon: {
    fontSize: 12,
  },
  cell: {
    justifyContent: 'flex-start',
  },
  emptyCell: {
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
