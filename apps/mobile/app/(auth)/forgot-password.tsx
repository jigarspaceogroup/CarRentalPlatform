import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError(t('forgotPassword.errors.emailRequired'));
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError(t('forgotPassword.errors.emailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  }, [email, t]);

  const handleSend = async () => {
    clearError();
    if (!validateEmail()) return;

    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      // Error is set in the store
    }
  };

  if (sent) {
    return (
      <View
        style={[
          styles.container,
          styles.centeredContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.successIconCircle}>
          <Text style={styles.successIcon}>{'\u2713'}</Text>
        </View>
        <Text style={styles.successTitle}>{t('forgotPassword.successTitle')}</Text>
        <Text style={styles.successMessage}>{t('forgotPassword.successMessage')}</Text>
        <Button
          title={t('forgotPassword.backToLogin')}
          onPress={() => router.replace('/(auth)/login')}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
            {t('forgotPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('forgotPassword.subtitle')}
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Email Input */}
        <Input
          label={t('common.email')}
          placeholder={t('forgotPassword.emailPlaceholder')}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!isLoading}
        />

        {/* Send Button */}
        <Button
          title={t('forgotPassword.sendButton')}
          onPress={handleSend}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={{ marginTop: spacing.sm }}
        />

        {/* Back to Login */}
        <Button
          title={t('forgotPassword.backToLogin')}
          onPress={() => router.back()}
          variant="ghost"
          size="md"
          textStyle={styles.backToLoginText}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
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
    marginBottom: spacing.lg,
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
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: colors.red[50],
    borderWidth: 1,
    borderColor: colors.red[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: fontSize.sm,
    color: colors.red[600],
    textAlign: 'center',
  },
  backToLoginText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    fontSize: 36,
    color: colors.green[500],
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
});
