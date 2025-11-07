import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DataTable as PaperTable, Text } from 'react-native-paper';

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  numeric?: boolean;
  width?: number | string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
  footer?: React.ReactNode;
}

export const DataTable = <T extends { id: string | number }>({
  data,
  columns,
  emptyMessage = 'Aucune donnée',
  actions,
  footer,
}: DataTableProps<T>) => {
  if (!data.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <PaperTable style={styles.table}>
        <PaperTable.Header>
          {columns.map((column) => (
            <PaperTable.Title key={column.key} numeric={column.numeric} style={{ width: column.width }}>
              {column.title}
            </PaperTable.Title>
          ))}
          {actions ? <PaperTable.Title style={styles.actionsHeader}>Actions</PaperTable.Title> : null}
        </PaperTable.Header>

        {data.map((item) => (
          <PaperTable.Row key={item.id}>
            {columns.map((column) => (
              <PaperTable.Cell key={column.key} numeric={column.numeric} style={{ width: column.width }}>
                {column.render ? column.render(item) : (item as any)[column.key]}
              </PaperTable.Cell>
            ))}
            {actions ? <PaperTable.Cell style={styles.actionsCell}>{actions(item)}</PaperTable.Cell> : null}
          </PaperTable.Row>
        ))}

        {footer}
      </PaperTable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  table: {
    minWidth: '100%',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
  },
  actionsHeader: {
    width: 160,
  },
  actionsCell: {
    flexDirection: 'row',
    width: 160,
  },
});
