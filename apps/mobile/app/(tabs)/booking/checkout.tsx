import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { currentLanguage } from '../../../src/i18n';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';
import api from '../../../src/lib/api';
import type { PriceBreakdown, CreateBookingPayload } from '../../../src/types/booking';

interface ExtraOption {
  id: string;
  nameEn: string;
  nameAr: string;
  pricePerDay: number;
  icon: string;
}

const AVAILABLE_EXTRAS: ExtraOption[] = [
  {
    id: 'baby_seat',
    nameEn: 'Baby Seat',
    nameAr: '\u0645\u0642\u0639\u062F \u0623\u0637\u0641\u0627\u0644',
    pricePerDay: 25,
    icon: '\uD83D\uDC76',
  },
  {
    id: 'gps',
    nameEn: 'GPS Navigation',
    nameAr: '\u0646\u0638\u0627\u0645 \u0645\u0644\u0627\u062D\u0629 GPS',
    pricePerDay: 15,
    icon: '\uD83D\uDDFA\uFE0F',
  },
  {
    id: 'insurance_premium',
    nameEn: 'Premium Insurance',
    nameAr: '\u062A\u0623\u0645\u064A\u0646 \u0634\u0627\u0645\u0644',
    pricePerDay: 50,
    icon: '\uD83D\uDEE1\uFE0F',
  },
  {
    id: 'additional_driver',
    nameEn: 'Additional Driver',
    nameAr: '\u0633\u0627\u0626\u0642 \u0625\u0636\u0627\u0641\u064A',
    pricePerDay: 30,
    icon: '\uD83D\uDC64',
  },
  {
    id: 'wifi_hotspot',
    nameEn: 'WiFi Hotspot',
    nameAr: '\u0646\u0642\u0637\u0629 \u0648\u0627\u064A \u0641\u0627\u064A',
    pricePerDay: 10,
    icon: '\uD83D\uDCF6',
  },
];

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

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

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const store = useBookingStore();
  const [selectedExtras, setSelectedExtras] = useState<string[]>(store.selectedExtras);
  const [termsAccepted, setTermsAccepted] = useState(store.termsAccepted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const rentalDays = getDaysBetween(store.pickupDate, store.dropoffDate);

  // Calculate local price breakdown
  const baseTotal = store.dailyRate * rentalDays;
  const extrasTotal = selectedExtras.reduce((sum, extraId) => {
    const extra = AVAILABLE_EXTRAS.find((e) => e.id === extraId);
    return sum + (extra ? extra.pricePerDay * rentalDays : 0);
  }, 0);
  const subtotal = baseTotal + extrasTotal;
  const discountAmount = store.discountApplied ? store.discountAmount : 0;
  const taxRate = 0.15; // 15% VAT
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const serviceFee = 10;
  const total = subtotal - discountAmount + taxAmount + serviceFee;

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const newExtras = prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId];
      return newExtras;
    });
  };

  const handleViewTerms = () => {
    router.push('/(tabs)/booking/terms');
  };

  const handleConfirmAndPay = async () => {
    if (!termsAccepted) {
      Alert.alert(t('common.error'), t('booking.acceptTermsRequired'));
      return;
    }
    if (!store.vehicleId || !store.pickupBranchId || !store.dropoffBranchId) {
      Alert.alert(t('common.error'), t('common.unknownError'));
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload: CreateBookingPayload = {
        vehicleId: store.vehicleId,
        pickupBranchId: store.pickupBranchId,
        dropoffBranchId: store.dropoffBranchId,
        pickupDate: `${store.pickupDate}T${store.pickupTime}:00`,
        dropoffDate: `${store.dropoffDate}T${store.dropoffTime}:00`,
        extras: selectedExtras,
        termsAccepted: true,
      };

      if (store.discountCode) {
        payload.discountCode = store.discountCode;
      }

      const { data } = await api.post('/bookings', payload);
      const booking = data.data ?? data;

      store.setBookingResult(booking.id, booking.referenceNumber);

      // Navigate to payment method selection
      router.push('/(tabs)/payment/method');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.unknownError');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('booking.checkout')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle & Dates Review */}
        <View style={styles.reviewCard}>
          <Text style={[styles.reviewCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.bookingSummary')}
          </Text>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.vehicle')}</Text>
            <Text style={styles.reviewValue}>{store.vehicleName}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.pickupDate')}</Text>
            <Text style={styles.reviewValue}>
              {formatDate(store.pickupDate)} {store.pickupTime}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.dropoffDate')}</Text>
            <Text style={styles.reviewValue}>
              {formatDate(store.dropoffDate)} {store.dropoffTime}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.duration')}</Text>
            <Text style={styles.reviewValue}>
              {rentalDays} {t('booking.days')}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.pickupBranch')}</Text>
            <Text style={styles.reviewValue}>{store.pickupBranchName}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{t('booking.dropoffBranch')}</Text>
            <Text style={styles.reviewValue}>{store.dropoffBranchName}</Text>
          </View>
        </View>

        {/* Extras Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.extras')}
          </Text>
          <Text style={[styles.sectionSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.extrasSubtitle')}
          </Text>

          {AVAILABLE_EXTRAS.map((extra) => {
            const isSelected = selectedExtras.includes(extra.id);
            const extraName = lang === 'ar' ? extra.nameAr : extra.nameEn;
            return (
              <TouchableOpacity
                key={extra.id}
                style={[styles.extraCard, isSelected && styles.extraCardSelected]}
                onPress={() => toggleExtra(extra.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.extraCardContent,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={styles.extraIcon}>{extra.icon}</Text>
                  <View style={styles.extraInfo}>
                    <Text
                      style={[
                        styles.extraName,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {extraName}
                    </Text>
                    <Text
                      style={[
                        styles.extraPrice,
                        { textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {extra.pricePerDay} SAR/{t('booking.perDay')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.extraCheckbox,
                      isSelected && styles.extraCheckboxChecked,
                    ]}
                  >
                    {isSelected && <Text style={styles.extraCheckmark}>{'\u2713'}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={[styles.priceCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.priceBreakdown')}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {t('booking.baseRate')} ({rentalDays} {t('booking.days')} x{' '}
              {store.dailyRate.toFixed(0)} SAR)
            </Text>
            <Text style={styles.priceValue}>{baseTotal.toFixed(2)} SAR</Text>
          </View>

          {selectedExtras.length > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {t('booking.extras')} ({selectedExtras.length})
              </Text>
              <Text style={styles.priceValue}>{extrasTotal.toFixed(2)} SAR</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountLabel]}>
                {t('booking.discount')} ({store.discountCode})
              </Text>
              <Text style={[styles.priceValue, styles.discountValue]}>
                -{discountAmount.toFixed(2)} SAR
              </Text>
            </View>
          )}

          {store.discountApplied && store.discountCode && discountAmount === 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.discountLabel]}>
                {t('booking.discount')} ({store.discountCode})
              </Text>
              <Text style={styles.priceNote}>{t('booking.discountAppliedAtPayment')}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {t('booking.tax')} (15%)
            </Text>
            <Text style={styles.priceValue}>{taxAmount.toFixed(2)} SAR</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('booking.serviceFee')}</Text>
            <Text style={styles.priceValue}>{serviceFee.toFixed(2)} SAR</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('booking.total')}</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} SAR</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <TouchableOpacity
          style={[
            styles.termsRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          onPress={() => setTermsAccepted(!termsAccepted)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              termsAccepted && styles.checkboxChecked,
            ]}
          >
            {termsAccepted && <Text style={styles.checkboxMark}>{'\u2713'}</Text>}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={[styles.termsText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('booking.agreeToTerms')}{' '}
            </Text>
            <TouchableOpacity onPress={handleViewTerms}>
              <Text style={styles.termsLink}>{t('booking.termsAndConditions')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Error */}
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Confirm & Pay Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.bottomBarTotal}>
          <Text style={styles.bottomBarTotalLabel}>{t('booking.total')}</Text>
          <Text style={styles.bottomBarTotalValue}>{total.toFixed(2)} SAR</Text>
        </View>
        <Button
          title={t('booking.confirmAndPay')}
          onPress={handleConfirmAndPay}
          disabled={!termsAccepted || isSubmitting}
          loading={isSubmitting}
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    fontWeight: fontWeight.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  reviewCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reviewLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  reviewValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1.5,
    textAlign: 'right',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  extraCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.gray[100],
  },
  extraCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  extraCardContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  extraIcon: {
    fontSize: 24,
  },
  extraInfo: {
    flex: 1,
  },
  extraName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  extraPrice: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  extraCheckbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraCheckboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  extraCheckmark: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  priceCardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  discountLabel: {
    color: colors.green[600],
  },
  discountValue: {
    color: colors.green[600],
    fontWeight: fontWeight.semibold,
  },
  priceNote: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  termsRow: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxMark: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 22,
  },
  termsLink: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  submitError: {
    fontSize: fontSize.sm,
    color: colors.red[500],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  bottomSpacer: {
    height: 140,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bottomBarTotalLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  bottomBarTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
});
