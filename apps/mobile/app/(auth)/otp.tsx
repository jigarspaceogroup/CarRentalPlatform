import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import OtpInput from '../../src/components/ui/OtpInput';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 300; // 5 minutes

function maskPhone(phone: string): string {
  // +966 512345678 -> +966 5** *** *678
  if (!phone || phone.length < 10) return phone;
  const countryCode = phone.slice(0, 4); // +966
  const firstDigit = phone.slice(4, 5);
  const lastThree = phone.slice(-3);
  return `${countryCode} ${firstDigit}** *** *${lastThree}`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function OtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const params = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, loginPhone, isLoading, error, clearError } = useAuthStore();

  const [otpValue, setOtpValue] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phone = params.phone || '';

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleVerify = useCallback(async () => {
    clearError();
    const code = otpValue.join('');
    if (code.length !== OTP_LENGTH) return;

    try {
      const result = await verifyOtp({ phone, code });
      if (result.isNewUser) {
        router.replace('/(auth)/profile-completion');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      // Error is set in the store
    }
  }, [otpValue, phone, verifyOtp, clearError, router]);

  const handleOtpComplete = useCallback(
    (code: string) => {
      if (code.length === OTP_LENGTH) {
        // Small delay to show the filled state before submitting
        setTimeout(() => {
          clearError();
          verifyOtp({ phone, code })
            .then((result) => {
              if (result.isNewUser) {
                router.replace('/(auth)/profile-completion');
              } else {
                router.replace('/(tabs)');
              }
            })
            .catch(() => {
              // Error is set in the store
            });
        }, 200);
      }
    },
    [phone, verifyOtp, clearError, router],
  );

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    clearError();

    try {
      await loginPhone({ phone });
      setCountdown(COUNTDOWN_SECONDS);
      setOtpValue(Array(OTP_LENGTH).fill(''));
      // Restart countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Error is set in the store
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = countdown === 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      {/* Back Button */}
      <Button
        title={t('common.back')}
        onPress={() => router.back()}
        variant="ghost"
        size="sm"
        fullWidth={false}
        textStyle={[styles.backText, { textAlign: isRTL ? 'right' : 'left' }]}
        style={[styles.backButton, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('otp.title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('otp.subtitle')}
        </Text>
        <Text
          style={[
            styles.phoneText,
            { textAlign: isRTL ? 'right' : 'left', writingDirection: 'ltr' },
          ]}
        >
          {maskPhone(phone)}
        </Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {/* OTP Input */}
      <OtpInput
        length={OTP_LENGTH}
        value={otpValue}
        onChange={setOtpValue}
        onComplete={handleOtpComplete}
        error={!!error}
      />

      {/* Countdown / Resend */}
      <View style={styles.resendContainer}>
        {canResend ? (
          <Button
            title={t('otp.resendCode')}
            onPress={handleResend}
            variant="ghost"
            size="sm"
            fullWidth={false}
            loading={resendLoading}
            textStyle={styles.resendActiveText}
          />
        ) : (
          <Text style={styles.resendText}>
            {t('otp.resendIn', { time: formatTime(countdown) })}
          </Text>
        )}
      </View>

      {/* Verify Button */}
      <Button
        title={t('otp.verifyButton')}
        onPress={handleVerify}
        loading={isLoading}
        disabled={isLoading || otpValue.join('').length !== OTP_LENGTH}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  phoneText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  errorBanner: {
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    fontSize: fontSize.sm,
    color: colors.red[600],
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  resendActiveText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
