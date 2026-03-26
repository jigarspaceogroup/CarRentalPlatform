import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../src/theme';
import { useVehicles } from '../../src/hooks/useVehicles';
import VehicleCard from '../../src/components/VehicleCard';
import EmptyState from '../../src/components/EmptyState';
import { VehicleCardSkeleton } from '../../src/components/SkeletonLoader';
import SortDropdown, {
  sortOptionToParams,
  type SortOption,
} from '../../src/components/SortDropdown';
import FilterBottomSheet, {
  countActiveFilters,
  type FilterValues,
} from '../../src/components/FilterBottomSheet';
import type { Vehicle } from '../../src/types/vehicle';

const DEBOUNCE_MS = 300;

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isInitialMount = useRef(true);

  const {
    vehicles,
    isLoading,
    isLoadingMore,
    meta,
    hasMore,
    loadMore,
    setFilters,
  } = useVehicles();

  // Focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search input change handler
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters({
          search: text.trim() || undefined,
          ...sortOptionToParams(sortOption),
          ...filterValues,
        });
      }, DEBOUNCE_MS);
    },
    [sortOption, filterValues, setFilters],
  );

  // Sync filters when sort or filter panel changes (not search text -- that uses debounce)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setFilters({
      search: searchText.trim() || undefined,
      ...sortOptionToParams(sortOption),
      ...filterValues,
    });
    // searchText is excluded from deps intentionally -- search uses debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, filterValues, setFilters]);

  const handleClear = () => {
    setSearchText('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilters({
      search: undefined,
      ...sortOptionToParams(sortOption),
      ...filterValues,
    });
    inputRef.current?.focus();
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleApplyFilters = (filters: FilterValues) => {
    setFilterValues(filters);
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearchText('');
    setSortOption('newest');
    setFilters({
      search: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  const activeFilterCount = countActiveFilters(filterValues);

  const renderVehicle = ({ item }: { item: Vehicle }) => <VehicleCard vehicle={item} />;

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        title={t('search.noResults')}
        subtitle={t('search.noResultsHint')}
        actionLabel={t('search.resetFilters')}
        onAction={handleResetFilters}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View
          style={[styles.searchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <View
            style={[
              styles.searchInputContainer,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.gray[400]}
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
          >
            <Text style={styles.filterIcon}>{'\u2699'}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sort & Results count */}
        <View
          style={[
            styles.subHeader,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {meta && !isLoading ? (
            <Text style={styles.resultCount}>
              {t('search.results', { count: meta.total })}
            </Text>
          ) : (
            <View />
          )}
          <SortDropdown value={sortOption} onChange={handleSortChange} />
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          keyboardDismissMode="on-drag"
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        initialValues={filterValues}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  searchRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[900],
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearText: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    fontWeight: fontWeight.bold,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 22,
    color: colors.gray[700],
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary[600],
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  subHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.lg,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
