import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  I18nManager,
  Dimensions,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { currentLanguage } from '../../../src/i18n';
import { useVehicleDetail } from '../../../src/hooks/useVehicleDetail';
import Button from '../../../src/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return num.toFixed(0);
}

function calcSavingsPercent(
  daily: number | string | null | undefined,
  other: number | string | null | undefined,
  multiplier: number,
): number {
  const dailyNum = typeof daily === 'string' ? parseFloat(daily) : (daily ?? 0);
  const otherNum = typeof other === 'string' ? parseFloat(other) : (other ?? 0);
  if (dailyNum <= 0 || otherNum <= 0) return 0;
  const equivalentDaily = dailyNum * multiplier;
  const savings = ((equivalentDaily - otherNum) / equivalentDaily) * 100;
  return Math.round(Math.max(0, savings));
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { vehicle, isLoading, error, refetch } = useVehicleDetail(id);
  const [activeImage, setActiveImage] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (!vehicle) return;
    try {
      await Share.share({
        message: `Check out this ${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${formatPrice(vehicle.dailyRate)} SAR/day`,
        title: `${vehicle.make} ${vehicle.model}`,
      });
    } catch {
      // Share cancelled or failed silently
    }
  };

  const onImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImage(index);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || t('common.error')}</Text>
        <Button
          title={t('common.retry')}
          onPress={refetch}
          variant="outline"
          size="md"
          fullWidth={false}
          style={{ marginTop: spacing.md }}
        />
        <TouchableOpacity onPress={handleBack} style={{ marginTop: spacing.md }}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = vehicle.images ?? [];
  const features: string[] = Array.isArray(vehicle.features)
    ? vehicle.features
    : [];
  const branchName =
    lang === 'ar'
      ? vehicle.branch?.nameAr
      : vehicle.branch?.nameEn;
  const branchAddress =
    lang === 'ar'
      ? vehicle.branch?.addressAr
      : vehicle.branch?.addressEn;

  const weeklySavings = calcSavingsPercent(vehicle.dailyRate, vehicle.weeklyRate, 7);
  const monthlySavings = calcSavingsPercent(vehicle.dailyRate, vehicle.monthlyRate, 30);
  const longTermSavings = calcSavingsPercent(vehicle.dailyRate, vehicle.longTermRate, 30);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image Carousel */}
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onImageScroll}
          >
            {images.length > 0 ? (
              images.map((img, index) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={[styles.carouselImage, styles.imagePlaceholder]}>
                <Text style={styles.imagePlaceholderText}>
                  {vehicle.make.charAt(0)}
                  {vehicle.model.charAt(0)}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Back button overlay */}
          <TouchableOpacity
            style={[
              styles.overlayButton,
              styles.overlayBack,
              { top: insets.top + spacing.sm },
              isRTL ? { right: spacing.md } : { left: spacing.md },
            ]}
            onPress={handleBack}
          >
            <Text style={styles.overlayButtonText}>{isRTL ? '\u2192' : '\u2190'}</Text>
          </TouchableOpacity>

          {/* Share button overlay */}
          <TouchableOpacity
            style={[
              styles.overlayButton,
              styles.overlayShare,
              { top: insets.top + spacing.sm },
              isRTL ? { left: spacing.md } : { right: spacing.md },
            ]}
            onPress={handleShare}
          >
            <Text style={styles.overlayShareIcon}>{'\u2197'}</Text>
          </TouchableOpacity>

          {/* Image dots */}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImage && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text
              style={[styles.vehicleTitle, { textAlign: isRTL ? 'right' : 'left' }]}
            >
              {vehicle.make} {vehicle.model}
            </Text>
            <Text
              style={[styles.vehicleYear, { textAlign: isRTL ? 'right' : 'left' }]}
            >
              {vehicle.year}
            </Text>
            <View style={[styles.priceHighlight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.priceMain}>
                {formatPrice(vehicle.dailyRate)} SAR
              </Text>
              <Text style={styles.priceUnit}>{t('vehicle.perDay')}</Text>
            </View>
          </View>

          {/* Specifications Grid */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
            >
              {t('vehicle.specifications')}
            </Text>
            <View style={styles.specGrid}>
              <SpecItem
                label={t('vehicle.make')}
                value={vehicle.make}
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.model')}
                value={vehicle.model}
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.year')}
                value={String(vehicle.year)}
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.seats')}
                value={String(vehicle.seats)}
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.doors')}
                value={String(vehicle.doors)}
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.transmission')}
                value={
                  vehicle.transmission === 'AUTOMATIC'
                    ? t('filter.automatic')
                    : t('filter.manual')
                }
                isRTL={isRTL}
              />
              <SpecItem
                label={t('vehicle.fuelType')}
                value={t(`filter.${vehicle.fuelType.toLowerCase()}`)}
                isRTL={isRTL}
              />
              {vehicle.trunkCapacity && (
                <SpecItem
                  label={t('vehicle.trunk')}
                  value={vehicle.trunkCapacity}
                  isRTL={isRTL}
                />
              )}
              {vehicle.mileagePolicy && (
                <SpecItem
                  label={t('vehicle.mileage')}
                  value={vehicle.mileagePolicy}
                  isRTL={isRTL}
                />
              )}
            </View>
          </View>

          {/* Pricing Section */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
            >
              {t('vehicle.pricing')}
            </Text>
            <View style={styles.pricingCards}>
              <PricingCard
                label={t('vehicle.dailyRate')}
                price={formatPrice(vehicle.dailyRate)}
                unit={t('vehicle.perDay')}
                isRTL={isRTL}
                highlighted
              />
              {vehicle.weeklyRate && (
                <PricingCard
                  label={t('vehicle.weeklyRate')}
                  price={formatPrice(vehicle.weeklyRate)}
                  unit={t('vehicle.perWeek')}
                  savings={
                    weeklySavings > 0
                      ? t('vehicle.savingsWeekly', { percent: weeklySavings })
                      : undefined
                  }
                  isRTL={isRTL}
                />
              )}
              {vehicle.monthlyRate && (
                <PricingCard
                  label={t('vehicle.monthlyRate')}
                  price={formatPrice(vehicle.monthlyRate)}
                  unit={t('vehicle.perMonth')}
                  savings={
                    monthlySavings > 0
                      ? t('vehicle.savingsMonthly', { percent: monthlySavings })
                      : undefined
                  }
                  isRTL={isRTL}
                />
              )}
              {vehicle.longTermRate && (
                <PricingCard
                  label={t('vehicle.longTermRate')}
                  price={formatPrice(vehicle.longTermRate)}
                  unit={t('vehicle.perMonth')}
                  savings={
                    longTermSavings > 0
                      ? t('vehicle.savingsLongTerm', { percent: longTermSavings })
                      : undefined
                  }
                  isRTL={isRTL}
                />
              )}
            </View>
          </View>

          {/* Features */}
          {features.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {t('vehicle.features')}
              </Text>
              <View style={[styles.featureList, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureChip}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Branch Info */}
          {vehicle.branch && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {t('vehicle.branchInfo')}
              </Text>
              <View style={styles.branchCard}>
                <View style={styles.branchIcon}>
                  <Text style={styles.branchIconText}>{'\uD83D\uDCCD'}</Text>
                </View>
                <View style={styles.branchDetails}>
                  <Text
                    style={[
                      styles.branchName,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {branchName}
                  </Text>
                  {branchAddress && (
                    <Text
                      style={[
                        styles.branchAddress,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {branchAddress}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Book Now CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={[styles.ctaPriceInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.ctaPrice}>{formatPrice(vehicle.dailyRate)} SAR</Text>
          <Text style={styles.ctaUnit}>{t('vehicle.perDay')}</Text>
        </View>
        <Button
          title={t('vehicle.bookNow')}
          onPress={() => {
            if (vehicle) {
              router.push(`/(tabs)/booking/${vehicle.id}`);
            }
          }}
          variant="primary"
          size="lg"
          fullWidth={false}
          disabled={vehicle?.status !== 'AVAILABLE'}
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

function SpecItem({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL: boolean;
}) {
  return (
    <View style={specStyles.item}>
      <Text
        style={[specStyles.label, { textAlign: isRTL ? 'right' : 'left' }]}
      >
        {label}
      </Text>
      <Text
        style={[specStyles.value, { textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function PricingCard({
  label,
  price,
  unit,
  savings,
  highlighted,
  isRTL,
}: {
  label: string;
  price: string;
  unit: string;
  savings?: string;
  highlighted?: boolean;
  isRTL: boolean;
}) {
  return (
    <View
      style={[
        pricingStyles.card,
        highlighted && pricingStyles.cardHighlighted,
      ]}
    >
      <Text
        style={[
          pricingStyles.label,
          { textAlign: isRTL ? 'right' : 'left' },
          highlighted && pricingStyles.labelHighlighted,
        ]}
      >
        {label}
      </Text>
      <View style={[pricingStyles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text
          style={[
            pricingStyles.price,
            highlighted && pricingStyles.priceHighlighted,
          ]}
        >
          {price} SAR
        </Text>
        <Text style={pricingStyles.unit}>{unit}</Text>
      </View>
      {savings ? <Text style={pricingStyles.savings}>{savings}</Text> : null}
    </View>
  );
}

const specStyles = StyleSheet.create({
  item: {
    width: '48%',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
});

const pricingStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.sm,
  },
  cardHighlighted: {
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  labelHighlighted: {
    color: colors.primary[700],
  },
  priceRow: {
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  priceHighlighted: {
    color: colors.primary[700],
  },
  unit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  savings: {
    fontSize: fontSize.xs,
    color: colors.green[600],
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.red[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  backLink: {
    fontSize: fontSize.md,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: colors.gray[100],
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  imagePlaceholderText: {
    fontSize: 64,
    fontWeight: fontWeight.bold,
    color: colors.primary[200],
  },
  overlayButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBack: {},
  overlayShare: {},
  overlayButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  overlayShareIcon: {
    fontSize: 18,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  imageDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  vehicleTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  vehicleYear: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: 2,
  },
  priceHighlight: {
    marginTop: spacing.sm,
    alignItems: 'baseline',
    gap: 4,
  },
  priceMain: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  priceUnit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pricingCards: {},
  featureList: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  branchIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchIconText: {
    fontSize: 20,
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  branchAddress: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaPriceInfo: {
    alignItems: 'baseline',
    gap: 4,
  },
  ctaPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  ctaUnit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  ctaButton: {
    minWidth: 140,
  },
});
