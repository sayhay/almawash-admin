import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Menu, TextInput } from 'react-native-paper';

type ToolbarFilterOption = {
  label: string;
  value?: string | number | null;
};

type ToolbarFilter = {
  key: string;
  label: string;
  options: ToolbarFilterOption[];
  value?: string | number | null;
  onChange: (value: string | number | null | undefined) => void;
};

type ServerToolbarProps = {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  filters?: ToolbarFilter[];
  onReset?: () => void;
  actions?: React.ReactNode;
};

const debounceDelay = 300;

export const ServerToolbar: React.FC<ServerToolbarProps> = ({
  searchPlaceholder = 'Rechercher…',
  onSearch,
  searchValue,
  filters,
  onReset,
  actions,
}) => {
  const [search, setSearch] = React.useState(searchValue ?? '');
  const [openMenuKey, setOpenMenuKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSearch(searchValue ?? '');
  }, [searchValue]);

  React.useEffect(() => {
    if (!onSearch) {
      return;
    }

    const handle = setTimeout(() => {
      onSearch(search.trim());
    }, debounceDelay);

    return () => clearTimeout(handle);
  }, [onSearch, search]);

  const handleSelectFilter = (filter: ToolbarFilter, option: ToolbarFilterOption) => {
    filter.onChange(option.value);
    setOpenMenuKey(null);
  };

  const reset = () => {
    setSearch('');
    onReset?.();
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <View style={[styles.container, Platform.OS === 'web' ? styles.webContainer : undefined]}>
      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          placeholder={searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {filters && filters.length > 0 ? (
        <View style={styles.filtersContainer}>
          {filters.map((filter) => {
            const selected = filter.options.find((option) => option.value === filter.value);
            const label = selected ? `${filter.label}: ${selected.label}` : filter.label;

            return (
              <Menu
                key={filter.key}
                visible={openMenuKey === filter.key}
                onDismiss={() => setOpenMenuKey(null)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setOpenMenuKey((prev) => (prev === filter.key ? null : filter.key))}
                    style={styles.filterButton}
                  >
                    {label}
                  </Button>
                }
              >
                {filter.options.map((option) => (
                  <Menu.Item
                    key={`${filter.key}-${option.value ?? 'all'}`}
                    onPress={() => handleSelectFilter(filter, option)}
                    title={option.label}
                  />
                ))}
              </Menu>
            );
          })}
        </View>
      ) : null}

      <View style={styles.actionsContainer}>
        {actions}
        {onReset ? (
          <Button onPress={reset} mode="text">
            Réinitialiser
          </Button>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 4,
  },
  webContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    minWidth: 200,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    marginRight: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
