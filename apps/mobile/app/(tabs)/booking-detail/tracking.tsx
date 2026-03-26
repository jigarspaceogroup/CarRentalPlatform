import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, I18nManager } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../../../src/theme";
import { currentLanguage } from "../../../src/i18n";
import { useBookingDetail } from "../../../src/hooks/useBookingDetail";
import type { BookingStatus } from "../../../src/types/booking";

const STATUS_ORDER: BookingStatus[] = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED"];

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: colors.yellow[400], CONFIRMED: colors.primary[500],
  ACTIVE: colors.green[500], COMPLETED: colors.gray[500],
  CANCELLED: colors.red[500], NO_SHOW: colors.orange[500],
};

function getCountdown(dropoffDate: string) {
  const now = new Date().getTime();
  const end = new Date(dropoffDate).getTime();
  const diff = end - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const { booking, isLoading, error, refetch } = useBookingDetail(id);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    if (!booking || booking.status !== "ACTIVE") return;
    const update = () => setCountdown(getCountdown(booking.dropoffDate));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [booking]);

  const handleBack = () => router.back();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || t("common.error")}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryButton}>
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(booking.status);
  const isCancelled = booking.status === "CANCELLED" || booking.status === "NO_SHOW";
  const isActive = booking.status === "ACTIVE";
  const isReadyForPickup = booking.status === "CONFIRMED";
  const contractSigned = booking.statusHistory?.some((s) => s.notes?.toLowerCase().includes("contract signed")) ?? false;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? "→" : "←"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("tracking.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("tracking.currentStatus")}</Text>
          <View style={[styles.currentStatusBadge, { backgroundColor: STATUS_COLORS[booking.status] }]}>
            <Text style={styles.currentStatusText}>{t(`bookingDetail.status.${booking.status.toLowerCase()}`)}</Text>
          </View>
          <Text style={styles.referenceNumber}>#{booking.referenceNumber}</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("tracking.statusTimeline")}</Text>
          {(isCancelled ? [booking.status] : STATUS_ORDER).map((status, index) => {
            const isCurrentOrPast = isCancelled ? true : currentStatusIndex >= index;
            const isCurrent = isCancelled ? true : booking.status === status;
            const isLast = isCancelled ? true : index === STATUS_ORDER.length - 1;
            const dotColor = isCurrentOrPast ? STATUS_COLORS[status as BookingStatus] : colors.gray[200];
            return (
              <View key={status} style={styles.timelineItem}>
                <View style={styles.timelineDotContainer}>
                  <View style={[styles.timelineDot, { backgroundColor: dotColor }, isCurrent && styles.timelineDotCurrent]} />
                  {!isLast && <View style={[styles.timelineLine, isCurrentOrPast && { backgroundColor: dotColor }]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, isCurrent && styles.timelineStatusActive, !isCurrentOrPast && styles.timelineStatusInactive]}>
                    {t(`bookingDetail.status.${(status as string).toLowerCase()}`)}
                  </Text>
                  {isCurrent && <Text style={styles.timelineCurrentLabel}>{t("tracking.currentStatus")}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {isActive && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? "right" : "left" }]}>{t("tracking.returnCountdown")}</Text>
            <View style={styles.countdownRow}>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{countdown.days}</Text>
                <Text style={styles.countdownLabel}>{t("tracking.days")}</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{countdown.hours}</Text>
                <Text style={styles.countdownLabel}>{t("tracking.hours")}</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{countdown.minutes}</Text>
                <Text style={styles.countdownLabel}>{t("tracking.minutes")}</Text>
              </View>
            </View>
          </View>
        )}

        {isReadyForPickup && (
          <View style={styles.card}>
            {!contractSigned ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/(tabs)/booking-detail/contract", params: { id } })}>
                <Text style={styles.actionButtonText}>{t("contract.signContract")}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.signedBadge}>
                  <Text style={styles.signedBadgeText}>{t("contract.contractSigned")}</Text>
                </View>
                <TouchableOpacity style={[styles.actionButton, { marginTop: spacing.sm }]} onPress={() => router.push({ pathname: "/(tabs)/booking-detail/otp-display", params: { id } })}>
                  <Text style={styles.actionButtonText}>{t("otp.title")}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.md, color: colors.gray[500] },
  errorText: { fontSize: fontSize.md, color: colors.red[500], textAlign: "center", paddingHorizontal: spacing.xl },
  retryButton: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary[500] },
  retryText: { color: colors.primary[600], fontWeight: fontWeight.medium },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 22, color: colors.gray[800], fontWeight: fontWeight.bold },
  headerTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.gray[900], marginHorizontal: spacing.sm },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.gray[100] },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.gray[900], marginBottom: spacing.md },
  currentStatusBadge: { alignSelf: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginBottom: spacing.sm },
  currentStatusText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.white },
  referenceNumber: { textAlign: "center", fontSize: fontSize.sm, color: colors.gray[500], fontVariant: ["tabular-nums"] },
  timelineItem: { flexDirection: "row", marginBottom: spacing.xs },
  timelineDotContainer: { alignItems: "center", width: 28, marginRight: spacing.md },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineDotCurrent: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: colors.white, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.gray[200], marginTop: 4, minHeight: 20 },
  timelineContent: { flex: 1, paddingBottom: spacing.md },
  timelineStatus: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.gray[900] },
  timelineStatusActive: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary[600] },
  timelineStatusInactive: { color: colors.gray[400] },
  timelineCurrentLabel: { fontSize: fontSize.xs, color: colors.primary[500], marginTop: 2 },
  countdownRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.md },
  countdownItem: { alignItems: "center", backgroundColor: colors.primary[50], borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minWidth: 72 },
  countdownValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary[700], fontVariant: ["tabular-nums"] },
  countdownLabel: { fontSize: fontSize.xs, color: colors.primary[500], marginTop: 2 },
  countdownSeparator: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary[400] },
  actionButton: { backgroundColor: colors.primary[600], paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: "center" },
  actionButtonText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  signedBadge: { backgroundColor: colors.green[500], paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center" },
  signedBadgeText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
