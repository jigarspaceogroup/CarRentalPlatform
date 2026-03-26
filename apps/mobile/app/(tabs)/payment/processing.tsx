import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, fontWeight } from '../../../src/theme';

const TIMEOUT_MS = 60000; // 60 seconds

export default function PaymentProcessingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  // Timeout fallback - if payment takes too long, go to failed screen
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)/payment/failed',
        params: { error: t('payment.timeout') },
      });
    }, TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>

        <Text style={styles.title}>{t('payment.processing')}</Text>
        <Text style={styles.subtitle}>{t('payment.processingSubtitle')}</Text>

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>

        <Text style={styles.warning}>{t('payment.doNotClose')}</Text>
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
    paddingHorizontal: spacing.xl,
  },
  loaderContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
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
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[300],
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  warning: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
