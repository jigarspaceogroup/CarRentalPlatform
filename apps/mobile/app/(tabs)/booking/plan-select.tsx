import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useBookingStore } from '../../../src/stores/booking';
import { useVehicleDetail } from '../../../src/hooks/useVehicleDetail';
import { Button } from '../../../src/components/ui';

type RentalPlan = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface PlanOption {
  type: RentalPlan;
  labelKey: string;
  multiplier: number;
  isBestValue?: boolean;
}

const PLAN_OPTIONS: PlanOption[] = [
  { type: 'HOURLY', labelKey: 'rentalPlans.hourly', multiplier: 1 / 24 },
  { type: 'DAILY', labelKey: 'rentalPlans.daily', multiplier: 1 },
  { type: 'WEEKLY', labelKey: 'rentalPlans.weekly', multiplier: 7, isBestValue: true },
  { type: 'MONTHLY', labelKey: 'rentalPlans.monthly', multiplier: 30, isBestValue: true },
];

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function calculatePlanPrice(
  baseDaily: number,
  plan: RentalPlan,
  days: number,
  weeklyRate?: number | null,
  monthlyRate?: number | null,
): number {
  switch (plan) {
    case 'HOURLY':
      return Math.ceil(baseDaily / 24) * days * 24;
    case 'DAILY':
      return baseDaily * days;
    case 'WEEKLY':
      if (weeklyRate && days >= 7) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        return weeks * weeklyRate + remainingDays * baseDaily;
      }
      return baseDaily * days;
    case 'MONTHLY':
      if (monthlyRate && days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return months * monthlyRate + remainingDays * baseDaily;
      }
      return baseDaily * days;
    default:
      return baseDaily * days;
  }
}

export default function RentalPlanSelectionScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const store = useBookingStore();
  const { vehicle, isLoading: vehicleLoading } = useVehicleDetail(vehicleId || store.vehicleId || undefined);
  const [selectedPlan, setSelectedPlan] = useState<RentalPlan>('DAILY');

  // Set vehicle in store when loaded
  useEffect(() => {
    if (vehicle && vehicleId) {
      const dailyNum =
        typeof vehicle.dailyRate === 'string'
          ? parseFloat(vehicle.dailyRate)
          : vehicle.dailyRate;
      const weeklyNum = vehicle.weeklyRate
        ? typeof vehicle.weeklyRate === 'string'
          ? parseFloat(vehicle.weeklyRate)
          : vehicle.weeklyRate
        : null;
      const monthlyNum = vehicle.monthlyRate
        ? typeof vehicle.monthlyRate === 'string'
          ? parseFloat(vehicle.monthlyRate)
          : vehicle.monthlyRate
        : null;
      store.setVehicle({
        vehicleId,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        vehicleImage: vehicle.images?.[0]?.imageUrl ?? null,
        dailyRate: dailyNum,
        weeklyRate: weeklyNum,
        monthlyRate: monthlyNum,
      });
    }
  }, [vehicle, vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    // Store selected plan and navigate to date selection
    store.setRentalPlan(selectedPlan);
    router.push(`/(tabs)/booking/${vehicleId || store.vehicleId}`);
  };

  const rentalDays = 1; // Default to 1 day for pricing estimate

  const dailyRate = store.dailyRate || 0;
  const weeklyRate = store.weeklyRate;
  const monthlyRate = store.monthlyRate;

  if (vehicleLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('rentalPlans.selectPlan')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Summary */}
        {store.vehicleName && (
          <View style={styles.vehicleSummary}>
            <View style={styles.vehicleInitials}>
              <Text style={styles.vehicleInitialsText}>
                {store.vehicleName.split(' ')[0]?.charAt(0) || 'V'}
                {store.vehicleName.split(' ')[1]?.charAt(0) || 'V'}
              </Text>
            </View>
            <View style={styles.vehicleSummaryInfo}>
              <Text
                style={[styles.vehicleSummaryName, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {store.vehicleName}
              </Text>
              <Text
                style={[styles.vehicleSummaryDates, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {rentalDays} {t('booking.days')}
              </Text>
            </View>
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.planCards}>
          {PLAN_OPTIONS.map((plan) => {
            const isSelected = selectedPlan === plan.type;
            const totalPrice = calculatePlanPrice(
              dailyRate,
              plan.type,
              rentalDays,
              weeklyRate,
              monthlyRate,
            );
            const dailyEquivalent = totalPrice / rentalDays;
            const savings =
              plan.type !== 'DAILY'
                ? Math.round(((dailyRate - dailyEquivalent) / dailyRate) * 100)
                : 0;

            return (
              <TouchableOpacity
                key={plan.type}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  plan.isBestValue && !isSelected && styles.planCardBestValue,
                ]}
                onPress={() => setSelectedPlan(plan.type)}
                activeOpacity={0.7}
              >
                {plan.isBestValue && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>{t('rentalPlans.bestValue')}</Text>
                  </View>
                )}

                <View
                  style={[
                    styles.planCardHeader,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View style={styles.planInfo}>
                    <Text
                      style={[
                        styles.planLabel,
                        { textAlign: isRTL ? 'right' : 'left' },
                        isSelected && styles.planLabelSelected,
                      ]}
                    >
                      {t(plan.labelKey)}
                    </Text>
                    {savings > 0 && (
                      <Text style={styles.planSavings}>
                        {t('rentalPlans.save', { percent: savings })}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                <View style={styles.planPricing}>
                  <Text
                    style={[
                      styles.planPrice,
                      { textAlign: isRTL ? 'right' : 'left' },
                      isSelected && styles.planPriceSelected,
                    ]}
                  >
                    {totalPrice.toFixed(0)} SAR
                  </Text>
                  <Text
                    style={[
                      styles.planPriceDetail,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                  >
                    ({dailyEquivalent.toFixed(0)} SAR/{t('rentalPlans.day')})
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={[styles.infoText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('rentalPlans.infoText')}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={t('booking.continue')}
          onPress={handleContinue}
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
  vehicleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: spacing.md,
  },
  vehicleInitials: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInitialsText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  vehicleSummaryInfo: {
    flex: 1,
  },
  vehicleSummaryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  vehicleSummaryDates: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  planCards: {
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  planCardBestValue: {
    borderColor: colors.green[400],
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.green[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  bestValueText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planCardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  planLabelSelected: {
    color: colors.primary[700],
  },
  planSavings: {
    fontSize: fontSize.xs,
    color: colors.green[600],
    fontWeight: fontWeight.medium,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary[600],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  planPricing: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  planPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  planPriceSelected: {
    color: colors.primary[700],
  },
  planPriceDetail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: fontSize.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
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
});
