import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../src/theme';
import { currentLanguage } from '../../src/i18n';
import { useBookings } from '../../src/hooks/useBookings';
import EmptyState from '../../src/components/EmptyState';
import type { Booking, BookingStatus } from '../../src/types/booking';

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  PENDING: { bg: colors.yellow[400], text: colors.gray[900] },
  CONFIRMED: { bg: colors.primary[500], text: colors.white },
  ACTIVE: { bg: colors.green[500], text: colors.white },
  COMPLETED: { bg: colors.gray[500], text: colors.white },
  CANCELLED: { bg: colors.red[500], text: colors.white },
  NO_SHOW: { bg: colors.orange[500], text: colors.white },
};

type HistoryTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const HISTORY_TABS: HistoryTab[] = ['ACTIVE', 'COMPLETED', 'CANCELLED'];

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

function mapTabToStatuses(tab: HistoryTab): BookingStatus[] {
  switch (tab) {
    case 'ACTIVE':
      return ['PENDING', 'CONFIRMED', 'ACTIVE'];
    case 'COMPLETED':
      return ['COMPLETED'];
    case 'CANCELLED':
      return ['CANCELLED', 'NO_SHOW'];
    default:
      return [];
  }
}

export default function RentalHistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { bookings: allBookings, isLoading, error, refetch } = useBookings();
  const [activeTab, setActiveTab] = useState<HistoryTab>('ACTIVE');
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBookingPress = (booking: Booking) => {
    router.push(`/(tabs)/history/${booking.id}`);
  };

  // Filter bookings by active tab
  const filteredBookings = allBookings.filter((booking) =>
    mapTabToStatuses(activeTab).includes(booking.status),
  );

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
    const totalAmount =
      typeof item.totalAmount === 'string'
        ? parseFloat(item.totalAmount)
        : item.totalAmount;

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => handleBookingPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.bookingCardHeader,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={styles.bookingCardInfo}>
            <Text
              style={[
                styles.bookingReference,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              #{item.referenceNumber}
            </Text>
            <Text
              style={[
                styles.bookingVehicle,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {item.vehicle.make} {item.vehicle.model} ({item.vehicle.year})
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
              {t(`bookingDetail.status.${item.status.toLowerCase()}`)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingCardDates}>
          <View style={styles.dateRow}>
            <Text style={styles.dateIcon}>{'\uD83D\uDCC5'}</Text>
            <Text style={styles.dateText}>
              {formatDate(item.pickupDate)} - {formatDate(item.dropoffDate)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bookingCardFooter,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={styles.totalAmount}>{totalAmount.toFixed(2)} SAR</Text>
          <Text style={styles.viewDetails}>
            {t('bookingDetail.viewDetails')} {isRTL ? '\u2190' : '\u2192'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('history.title')}
      </Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {HISTORY_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {t(`history.tab.${tab.toLowerCase()}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={t('history.noHistory')}
          subtitle={t('history.noHistorySubtitle')}
          actionLabel={t('bookings.browseVehicles')}
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[600]}
              colors={[colors.primary[600]]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[600],
  },
  filterTabText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  },
  filterTabTextActive: {
    color: colors.white,
  },
  centered: {
    flex: 1,
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
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  retryButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCardHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bookingCardInfo: {
    flex: 1,
  },
  bookingReference: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  bookingVehicle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  bookingCardDates: {
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[50],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateIcon: {
    fontSize: fontSize.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  bookingCardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[50],
  },
  totalAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  viewDetails: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
});
