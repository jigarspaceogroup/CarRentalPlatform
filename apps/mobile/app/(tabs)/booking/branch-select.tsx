import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { currentLanguage } from '../../../src/i18n';
import { useBranches } from '../../../src/hooks/useBranches';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';
import type { BookingBranch } from '../../../src/types/booking';

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_AR = [
  '\u0627\u0644\u0623\u062D\u062F',
  '\u0627\u0644\u0627\u062B\u0646\u064A\u0646',
  '\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621',
  '\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621',
  '\u0627\u0644\u062E\u0645\u064A\u0633',
  '\u0627\u0644\u062C\u0645\u0639\u0629',
  '\u0627\u0644\u0633\u0628\u062A',
];

function getTodayHours(
  branch: BookingBranch,
  lang: 'en' | 'ar',
): string {
  const today = new Date().getDay();
  const hours = branch.operatingHours?.find((h) => h.dayOfWeek === today);
  if (!hours || hours.isClosed) {
    return lang === 'ar' ? '\u0645\u063A\u0644\u0642 \u0627\u0644\u064A\u0648\u0645' : 'Closed today';
  }
  const dayName = lang === 'ar' ? DAY_NAMES_AR[today] : DAY_NAMES_EN[today];
  return `${dayName}: ${hours.openTime} - ${hours.closeTime}`;
}

export default function BranchSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const lang = currentLanguage();

  const { branches, isLoading, error, refetch } = useBranches();
  const store = useBookingStore();

  const [pickupBranchId, setPickupBranchId] = useState<string | null>(
    store.pickupBranchId,
  );
  const [dropoffBranchId, setDropoffBranchId] = useState<string | null>(
    store.dropoffBranchId,
  );
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'dropoff'>('pickup');

  const handleSelectBranch = (branch: BookingBranch) => {
    const branchName = lang === 'ar' ? branch.nameAr : branch.nameEn;
    if (selectionMode === 'pickup') {
      setPickupBranchId(branch.id);
      store.setPickupBranch(branch.id, branchName);
      // Auto-set dropoff to same branch if not yet selected
      if (!dropoffBranchId) {
        setDropoffBranchId(branch.id);
        store.setDropoffBranch(branch.id, branchName);
      }
      setSelectionMode('dropoff');
    } else {
      setDropoffBranchId(branch.id);
      store.setDropoffBranch(branch.id, branchName);
    }
  };

  const handleCallBranch = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleContinue = () => {
    if (!pickupBranchId || !dropoffBranchId) return;
    router.push('/(tabs)/booking/checkout');
  };

  const handleBack = () => {
    router.back();
  };

  const canContinue = !!pickupBranchId && !!dropoffBranchId;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('booking.selectBranch')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Selection Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            selectionMode === 'pickup' && styles.modeButtonActive,
          ]}
          onPress={() => setSelectionMode('pickup')}
        >
          <Text
            style={[
              styles.modeButtonText,
              selectionMode === 'pickup' && styles.modeButtonTextActive,
            ]}
          >
            {t('booking.pickupBranch')}
          </Text>
          {pickupBranchId && (
            <Text style={styles.modeButtonCheck}>{'\u2713'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            selectionMode === 'dropoff' && styles.modeButtonActive,
          ]}
          onPress={() => setSelectionMode('dropoff')}
        >
          <Text
            style={[
              styles.modeButtonText,
              selectionMode === 'dropoff' && styles.modeButtonTextActive,
            ]}
          >
            {t('booking.dropoffBranch')}
          </Text>
          {dropoffBranchId && (
            <Text style={styles.modeButtonCheck}>{'\u2713'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selection Info */}
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionInfoText}>
          {selectionMode === 'pickup'
            ? t('booking.selectPickupBranch')
            : t('booking.selectDropoffBranch')}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title={t('common.retry')}
            onPress={refetch}
            variant="outline"
            size="md"
            fullWidth={false}
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {branches.map((branch) => {
            const branchName = lang === 'ar' ? branch.nameAr : branch.nameEn;
            const branchAddress =
              lang === 'ar' ? branch.addressAr : branch.addressEn;
            const isSelectedPickup = branch.id === pickupBranchId;
            const isSelectedDropoff = branch.id === dropoffBranchId;
            const isCurrentSelection =
              selectionMode === 'pickup' ? isSelectedPickup : isSelectedDropoff;

            return (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  isCurrentSelection && styles.branchCardSelected,
                ]}
                onPress={() => handleSelectBranch(branch)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.branchCardHeader,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <View style={styles.branchIconContainer}>
                    <Text style={styles.branchIcon}>{'\uD83D\uDCCD'}</Text>
                  </View>
                  <View style={styles.branchCardInfo}>
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
                        numberOfLines={2}
                      >
                        {branchAddress}
                      </Text>
                    )}
                  </View>
                  {isCurrentSelection && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{'\u2713'}</Text>
                    </View>
                  )}
                </View>

                {/* Operating hours today */}
                <View style={styles.branchMeta}>
                  <Text style={styles.branchHours}>
                    {'\uD83D\uDD52'} {getTodayHours(branch, lang)}
                  </Text>
                </View>

                {/* Phone */}
                {branch.phone && (
                  <TouchableOpacity
                    style={styles.phoneRow}
                    onPress={() => handleCallBranch(branch.phone!)}
                  >
                    <Text style={styles.phoneIcon}>{'\uD83D\uDCDE'}</Text>
                    <Text style={styles.phoneText}>{branch.phone}</Text>
                  </TouchableOpacity>
                )}

                {/* Selection labels */}
                <View style={styles.branchLabels}>
                  {isSelectedPickup && (
                    <View style={styles.labelBadge}>
                      <Text style={styles.labelBadgeText}>{t('booking.pickup')}</Text>
                    </View>
                  )}
                  {isSelectedDropoff && (
                    <View style={[styles.labelBadge, styles.labelBadgeDropoff]}>
                      <Text style={styles.labelBadgeText}>{t('booking.dropoff')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: colors.primary[600],
  },
  modeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  modeButtonCheck: {
    fontSize: fontSize.xs,
    color: colors.green[500],
    fontWeight: fontWeight.bold,
  },
  selectionInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
  },
  selectionInfoText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  branchCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray[100],
  },
  branchCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  branchCardHeader: {
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  branchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchIcon: {
    fontSize: 20,
  },
  branchCardInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  branchAddress: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  branchMeta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  branchHours: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  phoneIcon: {
    fontSize: fontSize.xs,
  },
  phoneText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  branchLabels: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  labelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[100],
  },
  labelBadgeDropoff: {
    backgroundColor: colors.green[400],
  },
  labelBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semibold,
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
