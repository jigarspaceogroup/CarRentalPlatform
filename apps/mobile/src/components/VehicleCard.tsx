import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../theme';
import { currentLanguage } from '../i18n';
import type { Vehicle } from '../types/vehicle';

interface VehicleCardProps {
  vehicle: Vehicle;
}

function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return num.toFixed(0);
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = currentLanguage();
  const isRTL = I18nManager.isRTL;

  const thumbnail =
    vehicle.images?.[0]?.thumbnailUrl || vehicle.images?.[0]?.imageUrl || null;

  const categoryName =
    lang === 'ar'
      ? (vehicle.category as { nameAr?: string })?.nameAr
      : (vehicle.category as { nameEn?: string })?.nameEn;

  const handlePress = () => {
    router.push(`/(tabs)/vehicle/${vehicle.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {vehicle.make.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.availabilityBadge}>
          <Text style={styles.availabilityText}>
            {t('vehicle.available')}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={1}
        >
          {vehicle.make} {vehicle.model}
        </Text>

        {categoryName ? (
          <Text
            style={[styles.category, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {categoryName}
          </Text>
        ) : null}

        <View style={[styles.details, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.specBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.specIcon}>
              {vehicle.transmission === 'AUTOMATIC' ? 'A' : 'M'}
            </Text>
            <Text style={styles.specText}>
              {vehicle.transmission === 'AUTOMATIC'
                ? t('filter.automatic')
                : t('filter.manual')}
            </Text>
          </View>
          <View style={[styles.specBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.specIcon}>{vehicle.year}</Text>
          </View>
        </View>

        <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.price}>
            {formatPrice(vehicle.dailyRate)} SAR
          </Text>
          <Text style={styles.priceUnit}>{t('vehicle.perDay')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 160,
    backgroundColor: colors.gray[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  imagePlaceholderText: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary[300],
  },
  availabilityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.green[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  availabilityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  info: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  details: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  specBadge: {
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  specIcon: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  },
  specText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  priceRow: {
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  priceUnit: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
});
