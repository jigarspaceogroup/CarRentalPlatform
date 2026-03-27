import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
  I18nManager,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../src/theme';
import { currentLanguage, changeLanguage } from '../../src/i18n';
import { useCategories } from '../../src/hooks/useCategories';
import { useVehicles } from '../../src/hooks/useVehicles';
import {
  CategorySkeleton,
  BannerSkeleton,
  HorizontalVehicleSkeleton,
} from '../../src/components/SkeletonLoader';
import type { Vehicle, VehicleCategory } from '../../src/types/vehicle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

const PROMO_BANNERS = [
  { id: '1', title: '20% Off Weekend Rentals', subtitle: 'Book now and save', color: '#2563eb' },
  { id: '2', title: 'New Luxury Collection', subtitle: 'Premium cars available', color: '#7c3aed' },
  { id: '3', title: 'Free GPS Navigation', subtitle: 'On all bookings this month', color: '#059669' },
];

function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return num.toFixed(0);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const {
    vehicles: popularVehicles,
    isLoading: vehiclesLoading,
    refetch: refetchVehicles,
  } = useVehicles({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });

  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll promotional banners
  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % PROMO_BANNERS.length;
        bannerScrollRef.current?.scrollTo({
          x: next * (BANNER_WIDTH + spacing.md),
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, []);

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + spacing.md));
    setActiveBanner(index);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchVehicles()]);
    setRefreshing(false);
  }, [refetchCategories, refetchVehicles]);

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleCategoryPress = (category: VehicleCategory) => {
    router.push(`/(tabs)/category/${category.id}` as never);
  };

  const handleLanguageToggle = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    router.push(`/(tabs)/vehicle/${vehicle.id}` as never);
  };

  // Get only root-level categories for the grid
  const rootCategories = categories.filter((c) => !c.parentId);

  const renderCategoryItem = ({ item }: { item: VehicleCategory }) => {
    const name = lang === 'ar' ? item.nameAr : item.nameEn;
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Text style={styles.categoryImageText}>{name?.charAt(0) ?? 'C'}</Text>
          </View>
        )}
        <Text style={styles.categoryName} numberOfLines={2}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPopularVehicle = ({ item }: { item: Vehicle }) => {
    const thumbnail = item.images?.[0]?.thumbnailUrl || item.images?.[0]?.imageUrl || null;
    return (
      <TouchableOpacity
        style={styles.popularCard}
        onPress={() => handleVehiclePress(item)}
        activeOpacity={0.7}
      >
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.popularImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.popularImagePlaceholder}>
            <Text style={styles.popularImageText}>{item.make.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.popularInfo}>
          <Text style={styles.popularTitle} numberOfLines={1}>
            {item.make} {item.model}
          </Text>
          <Text style={styles.popularYear}>{item.year}</Text>
          <View style={[styles.popularPriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.popularPrice}>{formatPrice(item.dailyRate)} SAR</Text>
            <Text style={styles.popularUnit}>{t('vehicle.perDay')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.logoContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CR</Text>
          </View>
        </View>
        <View style={[styles.topBarActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.langButton} onPress={handleLanguageToggle}>
            <Text style={styles.langText}>{lang === 'en' ? '\u0639\u0631' : 'En'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifButton}>
            <Text style={styles.notifIcon}>{'\uD83D\uDD14'}</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[600]} />
        }
      >
        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress} activeOpacity={0.7}>
          <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
          <Text style={[styles.searchPlaceholder, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('home.search')}
          </Text>
        </TouchableOpacity>

        {/* Promotional Banners */}
        <View style={styles.bannerSection}>
          {categoriesLoading && vehiclesLoading ? (
            <BannerSkeleton />
          ) : (
            <>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onBannerScroll}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH + spacing.md}
                snapToAlignment="start"
                contentContainerStyle={styles.bannerScrollContent}
              >
                {PROMO_BANNERS.map((banner) => (
                  <View
                    key={banner.id}
                    style={[styles.bannerCard, { backgroundColor: banner.color, width: BANNER_WIDTH }]}
                  >
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.bannerDots}>
                {PROMO_BANNERS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeBanner && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('home.categories')}
          </Text>
        </View>

        {categoriesLoading ? (
          <View style={styles.categoryGrid}>
            {[1, 2, 3, 4].map((i) => (
              <CategorySkeleton key={i} />
            ))}
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {rootCategories.map((cat) => (
              <View key={cat.id} style={styles.categoryGridItem}>
                {renderCategoryItem({ item: cat })}
              </View>
            ))}
          </View>
        )}

        {/* Popular Vehicles */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.sectionTitle}>{t('home.popular')}</Text>
          <TouchableOpacity onPress={handleSearchPress}>
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {vehiclesLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
          >
            {[1, 2, 3].map((i) => (
              <HorizontalVehicleSkeleton key={i} />
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={popularVehicles}
            renderItem={renderPopularVehicle}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            }
          />
        )}

        {/* Bottom spacer */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  topBarActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  langButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  langText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  },
  notifButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  notifIcon: {
    fontSize: 22,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: colors.red[500],
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  bannerSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  bannerScrollContent: {
    gap: spacing.md,
  },
  bannerCard: {
    height: 160,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  dotActive: {
    backgroundColor: colors.primary[600],
    width: 20,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  categoryGridItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  categoryImage: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImageText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.primary[300],
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[800],
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  popularList: {
    paddingHorizontal: spacing.lg,
  },
  popularCard: {
    width: 200,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: 120,
  },
  popularImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularImageText: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.primary[300],
  },
  popularInfo: {
    padding: spacing.sm,
  },
  popularTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  popularYear: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  popularPriceRow: {
    alignItems: 'baseline',
    gap: 2,
    marginTop: spacing.xs,
  },
  popularPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  popularUnit: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    padding: spacing.lg,
  },
});
