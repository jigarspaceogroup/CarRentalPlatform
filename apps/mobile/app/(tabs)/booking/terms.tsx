import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';

const TERMS_TEXT_EN = `RENTAL AGREEMENT TERMS AND CONDITIONS

1. RENTAL ELIGIBILITY
1.1 The renter must be at least 21 years of age and hold a valid driving license for a minimum of 1 year.
1.2 An international driving license is required for non-residents.
1.3 The renter must present a valid national ID or passport at the time of pickup.

2. RENTAL PERIOD
2.1 The rental period begins at the time of vehicle pickup and ends at the time of return.
2.2 Late returns may incur additional charges at the daily rate plus a late fee.
2.3 Early returns do not entitle the renter to a refund of unused days unless otherwise agreed.

3. VEHICLE CONDITION
3.1 The renter acknowledges receiving the vehicle in good working condition.
3.2 Any pre-existing damage will be documented at the time of pickup.
3.3 The renter is responsible for returning the vehicle in the same condition.

4. INSURANCE AND LIABILITY
4.1 Basic insurance coverage is included in the rental rate.
4.2 The renter is liable for a deductible amount in case of an accident.
4.3 Premium insurance reduces or eliminates the deductible amount.
4.4 Insurance does not cover damage caused by negligence, driving under the influence, or off-road use.

5. FUEL POLICY
5.1 The vehicle will be provided with a full tank of fuel.
5.2 The renter must return the vehicle with a full tank.
5.3 A refueling charge will apply if the vehicle is returned with less fuel.

6. MILEAGE POLICY
6.1 The rental includes a daily mileage allowance as specified in the booking.
6.2 Excess mileage will be charged at the rate specified in the booking confirmation.

7. PROHIBITED USE
7.1 The vehicle must not be used for racing, towing, or any illegal activity.
7.2 Smoking in the vehicle is prohibited. A cleaning fee will apply for violations.
7.3 The vehicle must not be driven outside the designated area without prior written consent.

8. CANCELLATION POLICY
8.1 Free cancellation is available up to 24 hours before the pickup time.
8.2 Cancellations made within 24 hours of pickup may incur a cancellation fee.
8.3 No-shows will be charged the full rental amount.

9. PAYMENT
9.1 Payment must be made in full at the time of booking or at pickup.
9.2 A security deposit may be required and will be refunded upon satisfactory return.
9.3 Additional charges (fuel, damage, traffic fines) will be charged to the provided payment method.

10. TRAFFIC VIOLATIONS
10.1 The renter is responsible for all traffic violations incurred during the rental period.
10.2 An administrative fee may be added to each traffic violation.

11. BREAKDOWN AND EMERGENCY
11.1 In case of breakdown, the renter must contact our 24/7 support hotline immediately.
11.2 Roadside assistance is included for mechanical failures.
11.3 The renter must not attempt unauthorized repairs.

12. PRIVACY
12.1 Personal information collected will be used solely for rental purposes.
12.2 We comply with local data protection regulations.

By proceeding with the booking, you acknowledge that you have read, understood, and agree to abide by these terms and conditions.`;

const TERMS_TEXT_AR = `\u0634\u0631\u0648\u0637 \u0648\u0623\u062D\u0643\u0627\u0645 \u0627\u062A\u0641\u0627\u0642\u064A\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0631

1. \u0623\u0647\u0644\u064A\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0631
1.1 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0639\u0645\u0631 \u0627\u0644\u0645\u0633\u062A\u0623\u062C\u0631 21 \u0639\u0627\u0645\u064B\u0627 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0648\u0623\u0646 \u064A\u062D\u0645\u0644 \u0631\u062E\u0635\u0629 \u0642\u064A\u0627\u062F\u0629 \u0633\u0627\u0631\u064A\u0629 \u0644\u0645\u062F\u0629 \u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 \u0633\u0646\u0629 \u0648\u0627\u062D\u062F\u0629.
1.2 \u064A\u0644\u0632\u0645 \u0631\u062E\u0635\u0629 \u0642\u064A\u0627\u062F\u0629 \u062F\u0648\u0644\u064A\u0629 \u0644\u063A\u064A\u0631 \u0627\u0644\u0645\u0642\u064A\u0645\u064A\u0646.
1.3 \u064A\u062C\u0628 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u0623\u062C\u0631 \u062A\u0642\u062F\u064A\u0645 \u0647\u0648\u064A\u0629 \u0648\u0637\u0646\u064A\u0629 \u0623\u0648 \u062C\u0648\u0627\u0632 \u0633\u0641\u0631 \u0633\u0627\u0631\u064A \u0639\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645.

2. \u0641\u062A\u0631\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0631
2.1 \u062A\u0628\u062F\u0623 \u0641\u062A\u0631\u0629 \u0627\u0644\u0625\u064A\u062C\u0627\u0631 \u0645\u0646 \u0648\u0642\u062A \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0633\u064A\u0627\u0631\u0629 \u0648\u062A\u0646\u062A\u0647\u064A \u0639\u0646\u062F \u0625\u0639\u0627\u062F\u062A\u0647\u0627.
2.2 \u0642\u062F \u062A\u062A\u0631\u062A\u0628 \u0631\u0633\u0648\u0645 \u0625\u0636\u0627\u0641\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062A\u0623\u062E\u0631\u0629.
2.3 \u0627\u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629 \u0644\u0627 \u062A\u0633\u062A\u062D\u0642 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0623\u064A\u0627\u0645 \u063A\u064A\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629.

\u0628\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0641\u064A \u0627\u0644\u062D\u062C\u0632\u060C \u0641\u0625\u0646\u0643 \u062A\u0642\u0631 \u0628\u0623\u0646\u0643 \u0642\u062F \u0642\u0631\u0623\u062A \u0648\u0641\u0647\u0645\u062A \u0648\u0648\u0627\u0641\u0642\u062A \u0639\u0644\u0649 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0647\u0630\u0647 \u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645.`;

export default function TermsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const store = useBookingStore();

  const termsText = isRTL ? TERMS_TEXT_AR : TERMS_TEXT_EN;

  const handleAccept = () => {
    store.setTermsAccepted(true);
    router.back();
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
          {t('booking.termsAndConditions')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <Text
          style={[
            styles.termsText,
            {
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
        >
          {termsText}
        </Text>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={t('booking.acceptTerms')}
          onPress={handleAccept}
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
    backgroundColor: colors.white,
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
  termsText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    lineHeight: 24,
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
