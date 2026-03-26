import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  I18nManager,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { currentLanguage } from '../../../src/i18n';
import { useVehicles } from '../../../src/hooks/useVehicles';
import { useCategories } from '../../../src/hooks/useCategories';
import VehicleCard from '../../../src/components/VehicleCard';
import EmptyState from '../../../src/components/EmptyState';
import { VehicleCardSkeleton } from '../../../src/components/SkeletonLoader';
import SortDropdown, {
  sortOptionToParams,
  type SortOption,
} from '../../../src/components/SortDropdown';
import FilterBottomSheet, {
  countActiveFilters,
  type FilterValues,
} from '../../../src/components/FilterBottomSheet';
import type { Vehicle, VehicleCategory } from '../../../src/types/vehicle';

export default function CategoryVehicleListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { categories } = useCategories();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const isInitialMount = useRef(true);

  const sortParams = sortOptionToParams(sortOption);
  const activeCategory = selectedSubcategory || id;

  const {
    vehicles,
    isLoading,
    isLoadingMore,
    meta,
    hasMore,
    loadMore,
    setFilters,
  } = useVehicles({
    categoryId: activeCategory,
    sortBy: sortParams.sortBy,
    sortOrder: sortParams.sortOrder,
    ...filterValues,
  });

  // Find current category and its subcategories
  const findCategory = useCallback(
    (cats: VehicleCategory[], targetId: string): VehicleCategory | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return cat;
        if (cat.subcategories?.length) {
          const found = findCategory(cat.subcategories, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const category = id ? findCategory(categories, id) : null;
  const subcategories = category?.subcategories ?? [];
  const categoryName = category
    ? lang === 'ar'
      ? category.nameAr
      : category.nameEn
    : '';

  // Update vehicle filters when sort/filter/subcategory changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setFilters({
      categoryId: activeCategory,
      ...sortOptionToParams(sortOption),
      ...filterValues,
    });
  }, [activeCategory, sortOption, filterValues, setFilters]);

  const handleBack = () => {
    router.back();
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleApplyFilters = (filters: FilterValues) => {
    setFilterValues(filters);
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
        title={t('category.noVehicles')}
        subtitle={t('search.noResultsHint')}
      />
    );
  };

  const renderHeader = () => (
    <>
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        {category?.imageUrl ? (
          <Image
            source={{ uri: category.imageUrl }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Text style={styles.categoryImageText}>{categoryName?.charAt(0) ?? 'C'}</Text>
          </View>
        )}
        <View style={styles.categoryOverlay}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          {meta ? (
            <Text style={styles.categoryCount}>
              {t('search.results', { count: meta.total })}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Subcategory chips */}
      {subcategories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryList}
          style={styles.subcategoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.subcategoryChip,
              !selectedSubcategory && styles.subcategoryChipActive,
            ]}
            onPress={() => setSelectedSubcategory(undefined)}
          >
            <Text
              style={[
                styles.subcategoryText,
                !selectedSubcategory && styles.subcategoryTextActive,
              ]}
            >
              {t('category.allSubcategories')}
            </Text>
          </TouchableOpacity>
          {subcategories.map((sub) => {
            const isActive = selectedSubcategory === sub.id;
            const name = lang === 'ar' ? sub.nameAr : sub.nameEn;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subcategoryChip, isActive && styles.subcategoryChipActive]}
                onPress={() => setSelectedSubcategory(sub.id)}
              >
                <Text
                  style={[styles.subcategoryText, isActive && styles.subcategoryTextActive]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Sort & Filter Row */}
      <View
        style={[
          styles.controlRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <SortDropdown value={sortOption} onChange={handleSortChange} />
        <TouchableOpacity
          style={[styles.filterButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.filterIcon}>{'\u2699'}</Text>
          <Text style={styles.filterLabel}>{t('search.filters')}</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back button */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading && vehicles.length === 0 ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
          {renderHeader()}
          {[1, 2, 3].map((i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

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
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.gray[800],
  },
  topBarTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
    textAlign: 'center',
  },
  categoryHeader: {
    height: 140,
    backgroundColor: colors.gray[200],
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImageText: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary[300],
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  categoryTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  categoryCount: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  subcategoryScroll: {
    marginBottom: spacing.md,
  },
  subcategoryList: {
    gap: spacing.sm,
  },
  subcategoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  subcategoryChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  subcategoryText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  subcategoryTextActive: {
    color: colors.white,
  },
  controlRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  filterButton: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    position: 'relative',
  },
  filterIcon: {
    fontSize: 16,
    color: colors.gray[700],
  },
  filterLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  filterBadge: {
    backgroundColor: colors.primary[600],
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
