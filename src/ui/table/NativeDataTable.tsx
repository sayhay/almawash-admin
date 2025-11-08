import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, DataTable as PaperDataTable, Text } from 'react-native-paper';

import type {
  DataGridXProps,
  GridColumn,
  GridPaginationModel,
  GridSortModel,
} from './types';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type NativeDataTableProps<T extends { id: number | string }> = DataGridXProps<T>;

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
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  onRowClick,
  getRowId = (row: T) => row.id,
  toolbar,
  emptyText = 'Aucune donnée',
}: NativeDataTableProps<T>) => {
  const isServerControlled = Boolean(serverMode && paginationModel);
  const [localPagination, setLocalPagination] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: paginationModel?.pageSize ?? DEFAULT_PAGE_SIZE,
  });

  const effectivePagination: GridPaginationModel = isServerControlled
    ? (paginationModel as GridPaginationModel)
    : localPagination;

  React.useEffect(() => {
    if (serverMode && paginationModel) {
      setLocalPagination({ ...paginationModel });
    }
  }, [paginationModel, serverMode]);

  const [localSortModel, setLocalSortModel] = React.useState<GridSortModel>(sortModel ?? []);

  React.useEffect(() => {
    if (serverMode) {
      setLocalSortModel(sortModel ?? []);
    }
  }, [serverMode, sortModel]);

  const activeSortModel = serverMode ? sortModel ?? [] : localSortModel;
  const activeSort = activeSortModel[0];

  const sortedRows = React.useMemo(() => {
    if (serverMode || !activeSort?.field) {
      return rows;
    }

    const column = columns.find((col) => String(col.field) === activeSort.field);
    if (!column) {
      return rows;
    }

    const sorted = [...rows].sort((a, b) => {
      const left = getCellValue(a, column);
      const right = getCellValue(b, column);
      return compareValues(left, right);
    });

    if (activeSort.sort === 'desc') {
      sorted.reverse();
    }

    return sorted;
  }, [activeSort?.field, activeSort?.sort, columns, rows, serverMode]);

  const paginatedRows = React.useMemo(() => {
    if (serverMode) {
      return rows;
    }

    const start = effectivePagination.page * effectivePagination.pageSize;
    return sortedRows.slice(start, start + effectivePagination.pageSize);
  }, [effectivePagination.page, effectivePagination.pageSize, rows, serverMode, sortedRows]);

  const totalItems = serverMode ? rowCount ?? rows.length : rows.length;
  const numberOfPages = Math.max(1, Math.ceil(totalItems / effectivePagination.pageSize));

  const handleChangePage = (page: number) => {
    if (serverMode && paginationModel && onPaginationModelChange) {
      onPaginationModelChange({ ...paginationModel, page });
    } else {
      setLocalPagination((prev) => ({ ...prev, page }));
    }
  };

  const handleChangePageSize = (pageSize: number) => {
    if (serverMode && paginationModel && onPaginationModelChange) {
      onPaginationModelChange({ ...paginationModel, page: 0, pageSize });
    } else {
      setLocalPagination({ page: 0, pageSize });
    }
  };

  const handleSort = (column: GridColumn<T>) => {
    if (column.sortable === false) {
      return;
    }

    const field = String(column.field);
    const current = (serverMode ? sortModel : localSortModel)?.[0];
    const isSameField = current?.field === field;
    const nextDirection: 'asc' | 'desc' | undefined = isSameField
      ? current?.sort === 'asc'
        ? 'desc'
        : undefined
      : 'asc';

    const nextModel: GridSortModel = nextDirection ? [{ field, sort: nextDirection }] : [];

    if (serverMode && onSortModelChange) {
      onSortModelChange(nextModel);
      if (paginationModel && onPaginationModelChange && paginationModel.page !== 0) {
        onPaginationModelChange({ ...paginationModel, page: 0 });
      }
    } else {
      setLocalSortModel(nextModel);
      setLocalPagination((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
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
              const isSorted = activeSort?.field === String(column.field);
              const icon = isSorted ? (activeSort?.sort === 'desc' ? 'arrow-down' : 'arrow-up') : undefined;

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

      {totalItems > effectivePagination.pageSize ? (
        <PaperDataTable.Pagination
          page={effectivePagination.page}
          numberOfPages={numberOfPages}
          onPageChange={handleChangePage}
          label={`${Math.min(totalItems, effectivePagination.page * effectivePagination.pageSize + 1)}-${Math.min(
            totalItems,
            (effectivePagination.page + 1) * effectivePagination.pageSize,
          )} sur ${totalItems}`}
          numberOfItemsPerPage={effectivePagination.pageSize}
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
