import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import SocialButton from '../../src/components/ui/SocialButton';
import TabToggle from '../../src/components/ui/TabToggle';
import PasswordStrength, { isPasswordStrong } from '../../src/components/ui/PasswordStrength';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^5\d{8}$/;

type AuthTab = 'email' | 'phone';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const { registerEmail, registerPhone, socialLogin, isLoading, error, clearError } =
    useAuthStore();

  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const validateEmail = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError(t('register.errors.emailRequired'));
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError(t('register.errors.emailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  }, [email, t]);

  const validatePassword = useCallback((): boolean => {
    if (!password) {
      setPasswordError(t('register.errors.passwordRequired'));
      return false;
    }
    if (!isPasswordStrong(password)) {
      setPasswordError(t('register.errors.passwordWeak'));
      return false;
    }
    setPasswordError('');
    return true;
  }, [password, t]);

  const validatePhone = useCallback((): boolean => {
    if (!phone.trim()) {
      setPhoneError(t('register.errors.phoneRequired'));
      return false;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setPhoneError(t('register.errors.phoneInvalid'));
      return false;
    }
    setPhoneError('');
    return true;
  }, [phone, t]);

  const handleEmailRegister = async () => {
    clearError();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    try {
      const result = await registerEmail({ email: email.trim(), password });
      if (result.requiresEmailVerification) {
        setShowCheckEmail(true);
      } else {
        // Auto-logged in, redirect to profile completion
        router.replace('/(auth)/profile-completion');
      }
    } catch {
      // Error is set in the store
    }
  };

  const handlePhoneRegister = async () => {
    clearError();
    if (!validatePhone()) return;

    try {
      const fullPhone = `+966${phone.trim()}`;
      await registerPhone({ phone: fullPhone });
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: fullPhone },
      });
    } catch {
      // Error is set in the store
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    // In a real app, this would trigger the OAuth flow via expo-auth-session
    // and obtain a provider token before calling the API.
    Alert.alert(
      'Social Login',
      `${provider} login will be available soon. This requires native OAuth integration.`,
    );
  };

  const handleRegister = () => {
    if (activeTab === 'email') {
      handleEmailRegister();
    } else {
      handlePhoneRegister();
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AuthTab);
    clearError();
    setEmailError('');
    setPasswordError('');
    setPhoneError('');
  };

  // Check email confirmation modal
  if (showCheckEmail) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.checkEmailContainer}>
          <View style={styles.checkEmailIconCircle}>
            <Text style={styles.checkEmailIcon}>{'@'}</Text>
          </View>
          <Text style={styles.checkEmailTitle}>{t('register.checkEmail')}</Text>
          <Text style={styles.checkEmailMessage}>
            {t('register.checkEmailMessage', { email })}
          </Text>
          <Button
            title={t('register.checkEmailDone')}
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('register.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('register.subtitle')}
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={[styles.socialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <SocialButton
            provider="google"
            title={t('register.socialGoogle').split(' ').pop() || 'Google'}
            onPress={() => handleSocialLogin('google')}
            disabled={isLoading}
          />
          <SocialButton
            provider="apple"
            title={t('register.socialApple').split(' ').pop() || 'Apple'}
            onPress={() => handleSocialLogin('apple')}
            disabled={isLoading}
          />
          <SocialButton
            provider="facebook"
            title={t('register.socialFacebook').split(' ').pop() || 'Facebook'}
            onPress={() => handleSocialLogin('facebook')}
            disabled={isLoading}
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('common.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Tab Toggle */}
        <TabToggle
          tabs={[
            { key: 'email', label: t('register.emailTab') },
            { key: 'phone', label: t('register.phoneTab') },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Error message */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Email Tab */}
        {activeTab === 'email' ? (
          <View>
            <Input
              label={t('common.email')}
              placeholder={t('register.emailPlaceholder')}
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
            <Input
              label={t('common.password')}
              placeholder={t('register.passwordPlaceholder')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isLoading}
            />
            <PasswordStrength password={password} />
          </View>
        ) : (
          /* Phone Tab */
          <View>
            <Input
              label={t('common.phone')}
              placeholder={t('register.phonePlaceholder')}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                if (phoneError) setPhoneError('');
              }}
              error={phoneError}
              leftText={t('register.countryCode')}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={9}
              editable={!isLoading}
            />
          </View>
        )}

        {/* Register Button */}
        <Button
          title={t('register.registerButton')}
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={{ marginTop: spacing.sm }}
        />

        {/* Login Link */}
        <View style={styles.bottomLink}>
          <Text style={[styles.bottomLinkText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
            {t('register.haveAccount')}{' '}
          </Text>
          <Button
            title={t('register.loginLink')}
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            size="sm"
            fullWidth={false}
            textStyle={styles.bottomLinkAction}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
  socialRow: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  divider: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
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
  bottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  bottomLinkText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  bottomLinkAction: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  checkEmailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  checkEmailIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  checkEmailIcon: {
    fontSize: 32,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
  },
  checkEmailTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  checkEmailMessage: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
