import * as React from 'react';
import { Platform } from 'react-native';

import { NativeDataTable } from './NativeDataTable';
import { WebDataGrid } from './WebDataGrid';
import type { DataGridXProps } from './types';

export type { GridColumn } from './WebDataGrid';
export type { DataGridXProps, GridPaginationModel, GridSortModel } from './types';
export { ServerToolbar } from './ServerToolbar';

export const DataGridX = <T extends { id: number | string }>(props: DataGridXProps<T>) => {
  if (Platform.OS === 'web') {
    return <WebDataGrid {...props} />;
  }

  return <NativeDataTable {...props} />;
};
