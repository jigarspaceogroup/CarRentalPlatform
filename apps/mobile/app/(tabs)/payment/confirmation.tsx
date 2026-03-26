import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PaymentConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const store = useBookingStore();

  // Override back button to go to bookings, not back through payment flow
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleViewBookings();
      return true;
    });
    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewBookings = () => {
    store.reset();
    router.replace('/(tabs)/bookings');
  };

  const handleBackToHome = () => {
    store.reset();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>{'\u2713'}</Text>
        </View>

        <Text style={styles.title}>{t('payment.bookingConfirmed')}</Text>
        <Text style={styles.subtitle}>{t('payment.bookingConfirmedSubtitle')}</Text>

        {/* Reference Number */}
        {store.referenceNumber && (
          <View style={styles.referenceCard}>
            <Text style={styles.referenceLabel}>{t('payment.referenceNumber')}</Text>
            <Text style={styles.referenceValue}>{store.referenceNumber}</Text>
          </View>
        )}

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          {store.vehicleName && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.vehicle')}</Text>
              <Text style={styles.summaryValue}>{store.vehicleName}</Text>
            </View>
          )}
          {store.pickupDate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.pickupDate')}</Text>
              <Text style={styles.summaryValue}>
                {formatDate(store.pickupDate)} {store.pickupTime}
              </Text>
            </View>
          )}
          {store.dropoffDate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.dropoffDate')}</Text>
              <Text style={styles.summaryValue}>
                {formatDate(store.dropoffDate)} {store.dropoffTime}
              </Text>
            </View>
          )}
          {store.pickupBranchName && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.pickupBranch')}</Text>
              <Text style={styles.summaryValue}>{store.pickupBranchName}</Text>
            </View>
          )}
          {store.pricing?.total && (
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <Text style={styles.summaryTotalLabel}>{t('booking.total')}</Text>
              <Text style={styles.summaryTotalValue}>
                {store.pricing.total.toFixed(2)} SAR
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={t('payment.viewMyBookings')}
          onPress={handleViewBookings}
          variant="primary"
          size="lg"
          style={styles.primaryButton}
        />
        <Button
          title={t('payment.backToHome')}
          onPress={handleBackToHome}
          variant="outline"
          size="lg"
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    fontSize: 40,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  referenceCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
    width: '100%',
  },
  referenceLabel: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  referenceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  summaryCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  summaryRowLast: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.sm,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1.5,
    textAlign: 'right',
  },
  summaryTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  summaryTotalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {},
  secondaryButton: {},
});
