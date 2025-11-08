import * as React from 'react';
import type {
  GridColDef,
  GridPaginationModel as MuiPaginationModel,
  GridRowParams,
  GridSortModel as MuiSortModel,
} from '@mui/x-data-grid';

import type {
  DataGridXProps,
  GridColumn,
  GridPaginationModel,
  GridSortModel,
} from './types';
export type { GridColumn } from './types';

const dataGridModule = require('@mui/x-data-grid') as typeof import('@mui/x-data-grid');
const { Box } = require('@mui/material');

const { DataGrid, useGridApiRef } = dataGridModule;

type WebDataGridProps<T extends { id: number | string }> = DataGridXProps<T>;

const frLocaleText = {
  noRowsLabel: 'Aucune donnée',
  noResultsOverlayLabel: 'Aucun résultat',
  errorOverlayDefaultLabel: 'Une erreur est survenue.',
  toolbarDensity: 'Densité',
  toolbarColumns: 'Colonnes',
  toolbarFilters: 'Filtres',
  toolbarExport: 'Exporter',
  toolbarExportCSV: 'Télécharger en CSV',
  toolbarExportPrint: 'Imprimer',
  columnMenuSortAsc: 'Tri croissant',
  columnMenuSortDesc: 'Tri décroissant',
  columnMenuFilter: 'Filtrer',
  columnMenuHideColumn: 'Masquer',
  columnMenuManageColumns: 'Gérer les colonnes',
  footerRowSelected: (count: number) => `${count.toLocaleString('fr-FR')} ligne(s) sélectionnée(s)`,
  footerTotalRows: 'Lignes totales :',
  MuiTablePagination: {
    labelRowsPerPage: 'Lignes par page :',
    labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
      `${from}–${to} sur ${count !== -1 ? count : `plus de ${to}`}`,
  },
};

export const WebDataGrid = <T extends { id: number | string }>({
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
}: WebDataGridProps<T>) => {
  const apiRef = typeof useGridApiRef === 'function' ? useGridApiRef() : undefined;

  const gridColumns = React.useMemo<GridColDef[]>(
    () =>
      columns.map((column: GridColumn<T>): GridColDef => ({
        field: String(column.field),
        headerName: column.headerName,
        width: column.width,
        flex: column.flex,
        sortable: column.sortable !== false,
        filterable: column.filterable ?? false,
        align: column.align,
        valueGetter: column.valueGetter
          ? (params) => column.valueGetter(params.value, params.row as T)
          : undefined,
        renderCell: column.renderCell
          ? (params) => column.renderCell({ row: params.row as T, value: params.value })
          : undefined,
      })),
    [columns],
  );

  const gridSortModel = React.useMemo<MuiSortModel>(
    () =>
      (sortModel ?? []).map((item) => ({
        field: item.field,
        sort: item.sort,
      })),
    [sortModel],
  );

  const handlePaginationModelChange = React.useCallback(
    (model: MuiPaginationModel) => {
      onPaginationModelChange?.({ page: model.page, pageSize: model.pageSize });
    },
    [onPaginationModelChange],
  );

  const handleSortModelChange = React.useCallback(
    (model: MuiSortModel) => {
      if (!onSortModelChange) {
        return;
      }

      const cleaned: GridSortModel = model
        .filter((item) => item.sort === 'asc' || item.sort === 'desc')
        .map((item) => ({ field: item.field, sort: item.sort as 'asc' | 'desc' }));

      onSortModelChange(cleaned);
    },
    [onSortModelChange],
  );

  const ToolbarSlot = React.useMemo(() => {
    if (!toolbar) {
      return undefined;
    }

    return () => <Box sx={{ p: 1 }}>{toolbar}</Box>;
  }, [toolbar]);

  const NoRowsOverlay = React.useMemo(() => {
    if (!emptyText) {
      return undefined;
    }

    return () => (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        {emptyText}
      </Box>
    );
  }, [emptyText]);

  const effectiveRowCount = serverMode ? rowCount ?? rows.length : rows.length;

  const isServer = serverMode === true;

  React.useEffect(() => {
    if (!apiRef?.current) {
      return;
    }

    apiRef.current.resize();
  }, [apiRef, gridColumns, rows, paginationModel?.page, paginationModel?.pageSize, isServer]);

  return (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Box sx={{ width: '100%', height: '100%', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          apiRef={apiRef}
          autoHeight={!isServer}
          rows={rows}
          columns={gridColumns}
          loading={loading}
          paginationMode={isServer ? 'server' : 'client'}
          sortingMode={isServer ? 'server' : 'client'}
          rowCount={effectiveRowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={paginationModel && onPaginationModelChange ? handlePaginationModelChange : undefined}
          sortModel={gridSortModel}
          onSortModelChange={isServer ? handleSortModelChange : undefined}
          disableRowSelectionOnClick
          getRowId={getRowId}
          onRowClick={onRowClick ? (params: GridRowParams<T>) => onRowClick(params.row as T) : undefined}
          slots={{
            toolbar: ToolbarSlot,
            noRowsOverlay: NoRowsOverlay,
          }}
          localeText={frLocaleText}
          pageSizeOptions={[5, 10, 20, 50]}
          sx={{
            flex: 1,
            border: 0,
            '--DataGrid-containerBackground': 'transparent',
            '& .MuiDataGrid-main': {
              flexGrow: 1,
              minHeight: 0,
            },
            '& .MuiDataGrid-columnHeaders': {
              lineHeight: '1.2',
              fontSize: 13,
            },
            '& .MuiDataGrid-cell': {
              lineHeight: '1.2',
              fontSize: 13,
            },
          }}
        />
      </Box>
    </Box>
  );
};
