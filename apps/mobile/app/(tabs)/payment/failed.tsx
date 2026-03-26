import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';
import api from '../../../src/lib/api';

export default function PaymentFailedScreen() {
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const store = useBookingStore();

  const handleTryAgain = () => {
    router.replace('/(tabs)/payment/method');
  };

  const handleDifferentMethod = () => {
    router.replace('/(tabs)/payment/method');
  };

  const handleCancelBooking = async () => {
    if (store.bookingId) {
      try {
        await api.post(`/bookings/${store.bookingId}/cancel`, {
          reason: 'Payment failed',
        });
      } catch {
        // Best effort cancellation
      }
    }
    store.reset();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.errorCircle}>
          <Text style={styles.errorIcon}>{'\u2717'}</Text>
        </View>

        <Text style={styles.title}>{t('payment.paymentFailed')}</Text>
        <Text style={styles.subtitle}>
          {error || t('payment.paymentFailedSubtitle')}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={t('payment.tryAgain')}
            onPress={handleTryAgain}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
          <Button
            title={t('payment.tryDifferentMethod')}
            onPress={handleDifferentMethod}
            variant="outline"
            size="lg"
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Cancel Link */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity onPress={handleCancelBooking} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>{t('payment.cancelBooking')}</Text>
        </TouchableOpacity>
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
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.red[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIcon: {
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  actionButton: {},
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  cancelLink: {
    paddingVertical: spacing.sm,
  },
  cancelLinkText: {
    fontSize: fontSize.sm,
    color: colors.red[500],
    fontWeight: fontWeight.medium,
    textDecorationLine: 'underline',
  },
});
