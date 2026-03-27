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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { currentLanguage } from '../../../src/i18n';
import { useBookingDetail } from '../../../src/hooks/useBookingDetail';
import { Button } from '../../../src/components/ui';
import api from '../../../src/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function PastBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { booking, isLoading, error, refetch } = useBookingDetail(id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRebooking, setIsRebooking] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleDownloadReceipt = async () => {
    if (!booking) return;
    try {
      setIsDownloading(true);
      const { data } = await api.get(`/bookings/${booking.id}/documents/receipt`);
      const receiptUrl = data.data?.url || data.url;

      if (receiptUrl) {
        // Open receipt in document viewer
        router.push({
          pathname: '/(tabs)/history/document-viewer',
          params: { url: receiptUrl, title: 'Receipt' },
        });
      } else {
        Alert.alert(t('common.error'), t('history.receiptNotAvailable'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('history.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRebook = async () => {
    if (!booking) return;
    try {
      setIsRebooking(true);
      const { data } = await api.post(`/bookings/${booking.id}/rebook`);
      const vehicleId = data.data?.vehicleId || booking.vehicleId;

      // Navigate to booking flow with pre-filled vehicle
      router.push(`/(tabs)/booking/${vehicleId}`);
    } catch (err) {
      Alert.alert(t('common.error'), t('history.rebookFailed'));
    } finally {
      setIsRebooking(false);
    }
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
      </View>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING;
  const totalAmount =
    typeof booking.totalAmount === 'string'
      ? parseFloat(booking.totalAmount)
      : booking.totalAmount;

  const pickupBranchName =
    lang === 'ar' ? booking.pickupBranch.nameAr : booking.pickupBranch.nameEn;
  const dropoffBranchName =
    lang === 'ar' ? booking.dropoffBranch.nameAr : booking.dropoffBranch.nameEn;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('history.bookingDetail')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <Text style={[styles.referenceNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
            #{booking.referenceNumber}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
              {t(`bookingDetail.status.${booking.status.toLowerCase()}`)}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('booking.vehicle')}
          </Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleInitials}>
              <Text style={styles.vehicleInitialsText}>
                {booking.vehicle.make.charAt(0)}
                {booking.vehicle.model.charAt(0)}
              </Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})
              </Text>
              <Text style={[styles.vehicleDetail, { textAlign: isRTL ? 'right' : 'left' }]}>
                {booking.vehicle.transmission} • {booking.vehicle.fuelType}
              </Text>
            </View>
          </View>
        </View>

        {/* Rental Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('bookingDetail.rentalDetails')}
          </Text>
          <View style={styles.detailsCard}>
            <DetailRow
              label={t('booking.pickupBranch')}
              value={pickupBranchName}
              isRTL={isRTL}
            />
            <DetailRow
              label={t('booking.pickupDate')}
              value={formatDate(booking.pickupDate)}
              isRTL={isRTL}
            />
            <DetailRow
              label={t('booking.dropoffBranch')}
              value={dropoffBranchName}
              isRTL={isRTL}
            />
            <DetailRow
              label={t('booking.dropoffDate')}
              value={formatDate(booking.dropoffDate)}
              isRTL={isRTL}
            />
          </View>
        </View>

        {/* Price Breakdown */}
        {booking.priceBreakdown && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('booking.priceBreakdown')}
            </Text>
            <View style={styles.priceCard}>
              <PriceRow
                label={t('booking.baseRate')}
                value={booking.priceBreakdown.baseTotal.toFixed(2)}
                isRTL={isRTL}
              />
              {booking.priceBreakdown.extrasTotal > 0 && (
                <PriceRow
                  label={t('booking.extras')}
                  value={booking.priceBreakdown.extrasTotal.toFixed(2)}
                  isRTL={isRTL}
                />
              )}
              {booking.priceBreakdown.discountAmount > 0 && (
                <PriceRow
                  label={t('booking.discount')}
                  value={`-${booking.priceBreakdown.discountAmount.toFixed(2)}`}
                  isRTL={isRTL}
                  isDiscount
                />
              )}
              <PriceRow
                label={t('booking.tax')}
                value={booking.priceBreakdown.taxAmount.toFixed(2)}
                isRTL={isRTL}
              />
              <View style={styles.priceDivider} />
              <PriceRow
                label={t('booking.total')}
                value={totalAmount.toFixed(2)}
                isRTL={isRTL}
                isTotal
              />
            </View>
          </View>
        )}

        {/* Status Timeline */}
        {booking.statusHistory && booking.statusHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('bookingDetail.statusTimeline')}
            </Text>
            <View style={styles.timelineCard}>
              {booking.statusHistory.map((entry, index) => (
                <View key={entry.id} style={styles.timelineEntry}>
                  <View style={styles.timelineDot} />
                  {index < booking.statusHistory.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>
                      {t(`bookingDetail.status.${entry.status.toLowerCase()}`)}
                    </Text>
                    <Text style={styles.timelineDate}>{formatDateTime(entry.createdAt)}</Text>
                    {entry.notes && <Text style={styles.timelineNotes}>{entry.notes}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Refund Status */}
        {booking.status === 'CANCELLED' && booking.paymentStatus === 'REFUNDED' && (
          <View style={styles.refundBanner}>
            <Text style={styles.refundIcon}>✓</Text>
            <Text style={styles.refundText}>{t('history.refundProcessed')}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
          <View style={styles.actionButtons}>
            <Button
              title={t('history.downloadReceipt')}
              onPress={handleDownloadReceipt}
              variant="outline"
              size="md"
              loading={isDownloading}
              style={styles.actionButton}
            />
            <Button
              title={t('history.rebook')}
              onPress={handleRebook}
              variant="primary"
              size="md"
              loading={isRebooking}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL: boolean;
}) {
  return (
    <View style={[detailStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[detailStyles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>
      <Text style={[detailStyles.value, { textAlign: isRTL ? 'right' : 'left' }]}>
        {value}
      </Text>
    </View>
  );
}

function PriceRow({
  label,
  value,
  isRTL,
  isTotal,
  isDiscount,
}: {
  label: string;
  value: string;
  isRTL: boolean;
  isTotal?: boolean;
  isDiscount?: boolean;
}) {
  return (
    <View style={[priceStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text
        style={[
          priceStyles.label,
          { textAlign: isRTL ? 'right' : 'left' },
          isTotal && priceStyles.labelTotal,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          priceStyles.value,
          { textAlign: isRTL ? 'right' : 'left' },
          isTotal && priceStyles.valueTotal,
          isDiscount && priceStyles.valueDiscount,
        ]}
      >
        {value} SAR
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
});

const priceStyles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  labelTotal: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  valueTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  valueDiscount: {
    color: colors.green[600],
  },
});

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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  referenceNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 4,
  },
  vehicleDetail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.sm,
  },
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  timelineEntry: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
    marginTop: 4,
    marginRight: spacing.md,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: colors.gray[200],
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  timelineNotes: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  refundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.green[200],
    gap: spacing.sm,
  },
  refundIcon: {
    fontSize: fontSize.lg,
    color: colors.green[600],
  },
  refundText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.green[700],
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
