import React, { useState } from 'react';
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
import { currentLanguage } from '../../../src/i18n';
import { useBookingDetail } from '../../../src/hooks/useBookingDetail';
import { Button, Input } from '../../../src/components/ui';
import type { BookingStatus } from '../../../src/types/booking';

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  PENDING: { bg: colors.yellow[400], text: colors.gray[900] },
  CONFIRMED: { bg: colors.primary[500], text: colors.white },
  ACTIVE: { bg: colors.green[500], text: colors.white },
  COMPLETED: { bg: colors.gray[500], text: colors.white },
  CANCELLED: { bg: colors.red[500], text: colors.white },
  NO_SHOW: { bg: colors.orange[500], text: colors.white },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const CANCELLABLE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { booking, isLoading, error, refetch, cancelBooking, isCancelling } =
    useBookingDetail(id);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    Alert.alert(
      t('bookingDetail.cancelConfirmTitle'),
      t('bookingDetail.cancelConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(cancelReason || undefined);
              setShowCancelForm(false);
            } catch {
              Alert.alert(t('common.error'), t('bookingDetail.cancelError'));
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error || !booking) {
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

  const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const pickupBranchName =
    lang === 'ar' ? booking.pickupBranch?.nameAr : booking.pickupBranch?.nameEn;
  const dropoffBranchName =
    lang === 'ar' ? booking.dropoffBranch?.nameAr : booking.dropoffBranch?.nameEn;
  const totalAmount =
    typeof booking.totalAmount === 'string'
      ? parseFloat(booking.totalAmount)
      : booking.totalAmount;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('bookingDetail.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Reference */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
              {t(`bookingDetail.status.${booking.status.toLowerCase()}`)}
            </Text>
          </View>
          <Text style={styles.referenceNumber}>#{booking.referenceNumber}</Text>
        </View>

        {/* Vehicle Info */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.vehicle')}
          </Text>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleInitials}>
              <Text style={styles.vehicleInitialsText}>
                {booking.vehicle.make.charAt(0)}
                {booking.vehicle.model.charAt(0)}
              </Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text
                style={[styles.vehicleName, { textAlign: isRTL ? 'right' : 'left' }]}
              >
                {booking.vehicle.make} {booking.vehicle.model}
              </Text>
              <Text style={styles.vehicleYear}>{booking.vehicle.year}</Text>
            </View>
          </View>
        </View>

        {/* Dates & Branches */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('bookingDetail.rentalDetails')}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('booking.pickupDate')}</Text>
            <Text style={styles.detailValue}>{formatDate(booking.pickupDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('booking.dropoffDate')}</Text>
            <Text style={styles.detailValue}>{formatDate(booking.dropoffDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('booking.pickupBranch')}</Text>
            <Text style={styles.detailValue}>{pickupBranchName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('booking.dropoffBranch')}</Text>
            <Text style={styles.detailValue}>{dropoffBranchName}</Text>
          </View>
        </View>

        {/* Price Breakdown */}
        {booking.priceBreakdown && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('booking.priceBreakdown')}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t('booking.baseRate')} ({booking.priceBreakdown.rentalDays}{' '}
                {t('booking.days')})
              </Text>
              <Text style={styles.detailValue}>
                {booking.priceBreakdown.baseTotal.toFixed(2)} SAR
              </Text>
            </View>
            {booking.priceBreakdown.extrasTotal > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('booking.extras')}</Text>
                <Text style={styles.detailValue}>
                  {booking.priceBreakdown.extrasTotal.toFixed(2)} SAR
                </Text>
              </View>
            )}
            {booking.priceBreakdown.discountAmount > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.green[600] }]}>
                  {t('booking.discount')}
                </Text>
                <Text style={{ color: colors.green[600], fontWeight: fontWeight.medium, fontSize: fontSize.sm }}>
                  -{booking.priceBreakdown.discountAmount.toFixed(2)} SAR
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('booking.tax')}</Text>
              <Text style={styles.detailValue}>
                {booking.priceBreakdown.taxAmount.toFixed(2)} SAR
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('booking.serviceFee')}</Text>
              <Text style={styles.detailValue}>
                {booking.priceBreakdown.serviceFee.toFixed(2)} SAR
              </Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('booking.total')}</Text>
              <Text style={styles.totalValue}>
                {booking.priceBreakdown.total.toFixed(2)} SAR
              </Text>
            </View>
          </View>
        )}

        {/* Status Timeline */}
        {booking.statusHistory && booking.statusHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('bookingDetail.statusTimeline')}
            </Text>
            {booking.statusHistory.map((entry, index) => {
              const entryStatusColor =
                STATUS_COLORS[entry.status] || STATUS_COLORS.PENDING;
              const isLast = index === booking.statusHistory.length - 1;
              return (
                <View key={entry.id} style={styles.timelineItem}>
                  <View style={styles.timelineDotContainer}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: entryStatusColor.bg },
                      ]}
                    />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>
                      {t(`bookingDetail.status.${entry.status.toLowerCase()}`)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {formatShortDate(entry.createdAt)}
                    </Text>
                    {entry.notes && (
                      <Text style={styles.timelineNotes}>{entry.notes}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cancellation Reason (if cancelled) */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <View style={styles.cancelReasonCard}>
            <Text style={styles.cancelReasonLabel}>
              {t('bookingDetail.cancellationReason')}
            </Text>
            <Text style={styles.cancelReasonText}>{booking.cancellationReason}</Text>
          </View>
        )}

        {/* Cancel Form */}
        {canCancel && showCancelForm && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('bookingDetail.cancelBooking')}
            </Text>
            <Input
              label={t('bookingDetail.cancelReasonLabel')}
              placeholder={t('bookingDetail.cancelReasonPlaceholder')}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.cancelActions}>
              <Button
                title={t('bookingDetail.confirmCancel')}
                onPress={handleCancel}
                variant="primary"
                size="md"
                loading={isCancelling}
                style={{ backgroundColor: colors.red[500] }}
              />
              <Button
                title={t('common.back')}
                onPress={() => setShowCancelForm(false)}
                variant="outline"
                size="md"
              />
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Cancel Button (if allowed) */}
      {canCancel && !showCancelForm && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button
            title={t('bookingDetail.cancelBooking')}
            onPress={() => setShowCancelForm(true)}
            variant="outline"
            size="lg"
            textStyle={{ color: colors.red[500] }}
            style={{ borderColor: colors.red[300] }}
          />
        </View>
      )}
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
  statusSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  referenceNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  vehicleInitials: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInitialsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  vehicleYear: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1.5,
    textAlign: 'right',
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timelineDotContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  timelineStatus: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  timelineDate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  timelineNotes: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  cancelReasonCard: {
    backgroundColor: colors.red[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.red[100],
  },
  cancelReasonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.red[600],
    marginBottom: spacing.xs,
  },
  cancelReasonText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 22,
  },
  cancelActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
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
