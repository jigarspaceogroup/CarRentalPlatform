import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { useOtp } from '@/hooks/useOtp';
import { useBookingDetail } from '@/hooks/useBookingDetail';

type OtpStatus = 'GENERATED' | 'DELIVERED' | 'USED' | 'EXPIRED';

interface Otp {
  id: string;
  code: string;
  status: OtpStatus;
  expiresAt: string;
  createdAt: string;
}

export default function OtpDisplayScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requestNewOtp, isLoading: isRequesting } = useOtp();
  const { booking, isLoading } = useBookingDetail(id || '');

  const [countdown, setCountdown] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Find the active OTP from booking
  const activeOtp = (booking as any)?.otps?.find(
    (o: Otp) => o.status === 'GENERATED' || o.status === 'DELIVERED'
  ) as Otp | undefined;

  // Countdown timer
  useEffect(() => {
    if (!activeOtp?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(activeOtp.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setCountdown('00:00:00');
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeOtp?.expiresAt]);

  const handleCopy = async () => {
    if (activeOtp?.code) {
      await Clipboard.setStringAsync(activeOtp.code);
      Alert.alert(t('otp.codeCopied'));
    }
  };

  const handleRequestNew = async () => {
    if (!id) return;
    try {
      await requestNewOtp(id);
      Alert.alert(t('common.success'), t('otp.requestNew'));
    } catch {
      Alert.alert(t('common.error'), t('otp.requestFailed'));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>{t('otp.title')}</Text>

        {/* OTP Code */}
        {activeOtp ? (
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>{t('otp.yourCode')}</Text>
            <Text style={[styles.otpCode, isExpired && styles.otpCodeExpired]}>
              {activeOtp.code}
            </Text>

            {/* Copy button */}
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Text style={styles.copyButtonText}>{t('otp.copyCode')}</Text>
            </TouchableOpacity>

            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>
                {isExpired ? t('otp.expired') : t('otp.expiresIn')}
              </Text>
              <Text style={[styles.countdown, isExpired && styles.countdownExpired]}>
                {countdown}
              </Text>
            </View>

            {/* Request new button */}
            {isExpired && (
              <TouchableOpacity
                style={styles.requestButton}
                onPress={handleRequestNew}
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.requestButtonText}>{t('otp.requestNew')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noOtpCard}>
            <Text style={styles.noOtpText}>{t('otp.noActiveCode')}</Text>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={handleRequestNew}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.requestButtonText}>{t('otp.requestNew')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>{t('otp.doNotShare')}</Text>
        </View>

        {/* Lock Box Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>{t('otp.lockBoxInstructions')}</Text>
          {['step1', 'step2', 'step3', 'step4', 'step5'].map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{t(`otp.${step}`)}</Text>
            </View>
          ))}
        </View>

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' },
  otpCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  otpLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  otpCode: { fontSize: 48, fontWeight: '800', color: '#111827', letterSpacing: 12, fontFamily: 'monospace' },
  otpCodeExpired: { color: '#9ca3af' },
  copyButton: { marginTop: 16, backgroundColor: '#eff6ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  copyButtonText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  countdownContainer: { marginTop: 20, alignItems: 'center' },
  countdownLabel: { fontSize: 12, color: '#6b7280' },
  countdown: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 4 },
  countdownExpired: { color: '#dc2626' },
  requestButton: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, minWidth: 160, alignItems: 'center' },
  requestButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  noOtpCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  noOtpText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  warningCard: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  warningText: { fontSize: 14, fontWeight: '600', color: '#dc2626', textAlign: 'center' },
  instructionsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  instructionsTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  backButton: { backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
});
