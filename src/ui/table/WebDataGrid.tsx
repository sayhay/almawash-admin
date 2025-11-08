import * as React from 'react';
import type {
  GridColDef,
  GridPaginationModel,
  GridRowParams,
  GridSortModel,
} from '@mui/x-data-grid';

import type { DataGridXProps, GridColumn, ServerPager } from './types';
export type { GridColumn, ServerPager } from './types';

const { DataGrid } = require('@mui/x-data-grid');
const { Box } = require('@mui/material');

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
  pagination,
  onPaginationChange,
  onRowClick,
  getRowId = (row: T) => row.id,
  toolbar,
  emptyText = 'Aucune donnée',
}: WebDataGridProps<T>) => {
  const pageSize = pagination?.pageSize ?? 10;

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

  const paginationModel = React.useMemo<ServerPager | undefined>(() => {
    if (!pagination) {
      return undefined;
    }
    return {
      page: pagination.page ?? 0,
      pageSize: pagination.pageSize ?? pageSize,
      sortField: pagination.sortField,
      sortDirection: pagination.sortDirection,
      search: pagination.search,
    };
  }, [pageSize, pagination]);

  const handlePaginationModelChange = React.useCallback(
    (model: GridPaginationModel) => {
      if (!pagination || !onPaginationChange) {
        return;
      }

      onPaginationChange({
        ...pagination,
        page: model.page,
        pageSize: model.pageSize,
      });
    },
    [onPaginationChange, pagination],
  );

  const handleSortModelChange = React.useCallback(
    (model: GridSortModel) => {
      if (!onPaginationChange || !pagination) {
        return;
      }

      const next = model[0];
      onPaginationChange({
        ...pagination,
        page: 0,
        sortField: next?.field,
        sortDirection: (next?.sort as 'asc' | 'desc' | undefined) ?? undefined,
      });
    },
    [onPaginationChange, pagination],
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

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <DataGrid
        autoHeight={!isServer}
        rows={rows}
        columns={gridColumns}
        loading={loading}
        paginationMode={isServer ? 'server' : 'client'}
        sortingMode={isServer ? 'server' : 'client'}
        rowCount={effectiveRowCount}
        paginationModel={paginationModel ? { page: paginationModel.page, pageSize: paginationModel.pageSize } : undefined}
        onPaginationModelChange={paginationModel ? handlePaginationModelChange : undefined}
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
  );
};
