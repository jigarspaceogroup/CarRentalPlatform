import React, { useState, useCallback, useEffect } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useVehicleDetail } from '../../../src/hooks/useVehicleDetail';
import { useBookingStore } from '../../../src/stores/booking';
import { Button, Input } from '../../../src/components/ui';
import api from '../../../src/lib/api';

const TIME_OPTIONS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  return num.toFixed(0);
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DateTimeSelectionScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const { vehicle, isLoading: vehicleLoading } = useVehicleDetail(vehicleId);
  const store = useBookingStore();

  const [pickupDate, setPickupDate] = useState(store.pickupDate || '');
  const [dropoffDate, setDropoffDate] = useState(store.dropoffDate || '');
  const [pickupTime, setPickupTime] = useState(store.pickupTime || '09:00');
  const [dropoffTime, setDropoffTime] = useState(store.dropoffTime || '09:00');
  const [discountCode, setDiscountCode] = useState(store.discountCode || '');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(store.discountApplied);
  const [discountError, setDiscountError] = useState('');
  const [showPickupTimes, setShowPickupTimes] = useState(false);
  const [showDropoffTimes, setShowDropoffTimes] = useState(false);
  const [dateError, setDateError] = useState('');

  const today = getTodayString();

  // Check availability when dates change
  const checkAvailability = useCallback(
    async (start: string, end: string) => {
      if (!vehicleId || !isValidDate(start) || !isValidDate(end)) return;
      if (start < today) {
        setDateError(t('booking.dateInPast'));
        setIsAvailable(false);
        return;
      }
      if (end <= start) {
        setDateError(t('booking.dropoffBeforePickup'));
        setIsAvailable(false);
        return;
      }
      setDateError('');
      try {
        setIsCheckingAvailability(true);
        const { data } = await api.get(`/vehicles/${vehicleId}/availability`, {
          params: { startDate: start, endDate: end },
        });
        const result = data.data ?? data;
        setIsAvailable(result.available ?? true);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    },
    [vehicleId, today, t],
  );

  useEffect(() => {
    if (isValidDate(pickupDate) && isValidDate(dropoffDate)) {
      checkAvailability(pickupDate, dropoffDate);
    }
  }, [pickupDate, dropoffDate, checkAvailability]);

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

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError('');
    try {
      setIsApplyingDiscount(true);
      // Discount will be applied after booking creation; for now, store the code
      store.setDiscountCode(discountCode.trim());
      setDiscountApplied(true);
      store.applyDiscount(0); // Actual amount computed server-side
    } catch {
      setDiscountError(t('booking.invalidDiscount'));
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleClearDiscount = () => {
    setDiscountCode('');
    setDiscountApplied(false);
    setDiscountError('');
    store.clearDiscount();
  };

  const handleContinue = () => {
    if (!isValidDate(pickupDate) || !isValidDate(dropoffDate)) {
      setDateError(t('booking.datesRequired'));
      return;
    }
    if (pickupDate < today) {
      setDateError(t('booking.dateInPast'));
      return;
    }
    if (dropoffDate <= pickupDate) {
      setDateError(t('booking.dropoffBeforePickup'));
      return;
    }
    if (isAvailable === false) return;

    store.setDates(pickupDate, dropoffDate);
    store.setTimes(pickupTime, dropoffTime);
    if (discountCode.trim()) {
      store.setDiscountCode(discountCode.trim());
    }

    router.push('/(tabs)/booking/branch-select');
  };

  const handleBack = () => {
    router.back();
  };

  const rentalDays =
    isValidDate(pickupDate) && isValidDate(dropoffDate) && dropoffDate > pickupDate
      ? getDaysBetween(pickupDate, dropoffDate)
      : 0;

  const canContinue =
    isValidDate(pickupDate) &&
    isValidDate(dropoffDate) &&
    dropoffDate > pickupDate &&
    pickupDate >= today &&
    isAvailable !== false &&
    !isCheckingAvailability;

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
          {t('booking.selectDates')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vehicle Info Summary */}
        {vehicle && (
          <View style={styles.vehicleSummary}>
            <View style={styles.vehicleInitials}>
              <Text style={styles.vehicleInitialsText}>
                {vehicle.make.charAt(0)}
                {vehicle.model.charAt(0)}
              </Text>
            </View>
            <View style={styles.vehicleSummaryInfo}>
              <Text
                style={[styles.vehicleSummaryName, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </Text>
              <View style={[styles.rateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.rateLabel}>{t('vehicle.dailyRate')}:</Text>
                <Text style={styles.rateValue}>
                  {formatPrice(vehicle.dailyRate)} SAR{t('vehicle.perDay')}
                </Text>
              </View>
              {vehicle.weeklyRate && (
                <View
                  style={[styles.rateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <Text style={styles.rateLabel}>{t('vehicle.weeklyRate')}:</Text>
                  <Text style={styles.rateValue}>
                    {formatPrice(vehicle.weeklyRate)} SAR{t('vehicle.perWeek')}
                  </Text>
                </View>
              )}
              {vehicle.monthlyRate && (
                <View
                  style={[styles.rateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <Text style={styles.rateLabel}>{t('vehicle.monthlyRate')}:</Text>
                  <Text style={styles.rateValue}>
                    {formatPrice(vehicle.monthlyRate)} SAR{t('vehicle.perMonth')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Pickup Date */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.pickupDate')}
          </Text>
          <Input
            placeholder={t('booking.datePlaceholder')}
            value={pickupDate}
            onChangeText={(text) => {
              setPickupDate(text);
              setDateError('');
            }}
            keyboardType="default"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />
        </View>

        {/* Pickup Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.pickupTime')}
          </Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => {
              setShowPickupTimes(!showPickupTimes);
              setShowDropoffTimes(false);
            }}
          >
            <Text style={styles.timeSelectorText}>{pickupTime}</Text>
            <Text style={styles.timeSelectorArrow}>{showPickupTimes ? '\u25B2' : '\u25BC'}</Text>
          </TouchableOpacity>
          {showPickupTimes && (
            <ScrollView
              style={styles.timeDropdown}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    time === pickupTime && styles.timeOptionActive,
                  ]}
                  onPress={() => {
                    setPickupTime(time);
                    setShowPickupTimes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      time === pickupTime && styles.timeOptionTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Dropoff Date */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.dropoffDate')}
          </Text>
          <Input
            placeholder={t('booking.datePlaceholder')}
            value={dropoffDate}
            onChangeText={(text) => {
              setDropoffDate(text);
              setDateError('');
            }}
            keyboardType="default"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
          />
        </View>

        {/* Dropoff Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.dropoffTime')}
          </Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => {
              setShowDropoffTimes(!showDropoffTimes);
              setShowPickupTimes(false);
            }}
          >
            <Text style={styles.timeSelectorText}>{dropoffTime}</Text>
            <Text style={styles.timeSelectorArrow}>
              {showDropoffTimes ? '\u25B2' : '\u25BC'}
            </Text>
          </TouchableOpacity>
          {showDropoffTimes && (
            <ScrollView
              style={styles.timeDropdown}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    time === dropoffTime && styles.timeOptionActive,
                  ]}
                  onPress={() => {
                    setDropoffTime(time);
                    setShowDropoffTimes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      time === dropoffTime && styles.timeOptionTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Date Error */}
        {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}

        {/* Availability Status */}
        {isCheckingAvailability && (
          <View style={styles.availabilityRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.availabilityChecking}>
              {t('booking.checkingAvailability')}
            </Text>
          </View>
        )}
        {!isCheckingAvailability && isAvailable === true && rentalDays > 0 && (
          <View style={styles.availabilityRow}>
            <Text style={styles.availableIcon}>{'\u2713'}</Text>
            <Text style={styles.availableText}>
              {t('booking.available')} - {rentalDays} {t('booking.days')}
            </Text>
          </View>
        )}
        {!isCheckingAvailability && isAvailable === false && !dateError && (
          <View style={styles.availabilityRow}>
            <Text style={styles.unavailableIcon}>{'\u2717'}</Text>
            <Text style={styles.unavailableText}>{t('booking.unavailableDates')}</Text>
          </View>
        )}

        {/* Rental Estimate */}
        {rentalDays > 0 && vehicle && isAvailable !== false && (
          <View style={styles.estimateCard}>
            <Text style={[styles.estimateTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('booking.estimatedTotal')}
            </Text>
            <View
              style={[styles.estimateRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <Text style={styles.estimateLabel}>
                {rentalDays} {t('booking.days')} x {formatPrice(vehicle.dailyRate)} SAR
              </Text>
              <Text style={styles.estimateValue}>
                {formatPrice(
                  (typeof vehicle.dailyRate === 'string'
                    ? parseFloat(vehicle.dailyRate)
                    : vehicle.dailyRate) * rentalDays,
                )}{' '}
                SAR
              </Text>
            </View>
          </View>
        )}

        {/* Discount Code */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.discountCode')}
          </Text>
          <View
            style={[
              styles.discountRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={styles.discountInputWrapper}>
              <Input
                placeholder={t('booking.enterDiscountCode')}
                value={discountCode}
                onChangeText={(text) => {
                  setDiscountCode(text);
                  setDiscountError('');
                  if (discountApplied) {
                    setDiscountApplied(false);
                    store.clearDiscount();
                  }
                }}
                autoCapitalize="characters"
                editable={!discountApplied}
                containerStyle={styles.discountInput}
              />
            </View>
            {discountApplied ? (
              <TouchableOpacity
                style={styles.discountClearButton}
                onPress={handleClearDiscount}
              >
                <Text style={styles.discountClearText}>{'\u2717'}</Text>
              </TouchableOpacity>
            ) : (
              <Button
                title={t('booking.apply')}
                onPress={handleApplyDiscount}
                variant="outline"
                size="sm"
                fullWidth={false}
                loading={isApplyingDiscount}
                disabled={!discountCode.trim()}
                style={styles.discountButton}
              />
            )}
          </View>
          {discountApplied && (
            <Text style={styles.discountSuccess}>{t('booking.discountApplied')}</Text>
          )}
          {discountError ? <Text style={styles.discountErrorText}>{discountError}</Text> : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={t('booking.continue')}
          onPress={handleContinue}
          disabled={!canContinue}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.gray[500],
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
  rateRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  rateLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  rateValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  inputContainer: {
    marginBottom: 0,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: 50,
  },
  timeSelectorText: {
    fontSize: fontSize.md,
    color: colors.gray[900],
  },
  timeSelectorArrow: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  timeDropdown: {
    maxHeight: 200,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  timeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  timeOptionActive: {
    backgroundColor: colors.primary[50],
  },
  timeOptionText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
  timeOptionTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  dateError: {
    fontSize: fontSize.sm,
    color: colors.red[500],
    marginBottom: spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  availabilityChecking: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  availableIcon: {
    fontSize: fontSize.md,
    color: colors.green[600],
    fontWeight: fontWeight.bold,
  },
  availableText: {
    fontSize: fontSize.sm,
    color: colors.green[600],
    fontWeight: fontWeight.medium,
  },
  unavailableIcon: {
    fontSize: fontSize.md,
    color: colors.red[500],
    fontWeight: fontWeight.bold,
  },
  unavailableText: {
    fontSize: fontSize.sm,
    color: colors.red[500],
    fontWeight: fontWeight.medium,
  },
  estimateCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  estimateTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  estimateRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  estimateValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  discountRow: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  discountInputWrapper: {
    flex: 1,
  },
  discountInput: {
    marginBottom: 0,
  },
  discountButton: {
    marginTop: 0,
    minHeight: 50,
  },
  discountClearButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.red[100],
  },
  discountClearText: {
    fontSize: fontSize.lg,
    color: colors.red[500],
    fontWeight: fontWeight.bold,
  },
  discountSuccess: {
    fontSize: fontSize.xs,
    color: colors.green[600],
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  discountErrorText: {
    fontSize: fontSize.xs,
    color: colors.red[500],
    marginTop: spacing.xs,
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
