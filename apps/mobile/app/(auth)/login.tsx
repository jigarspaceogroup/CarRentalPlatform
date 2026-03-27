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
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^5\d{8}$/;

type AuthTab = 'email' | 'phone';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const { loginEmail, loginPhone, isLoading, error, clearError } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateEmail = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError(t('login.errors.emailRequired'));
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError(t('login.errors.emailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  }, [email, t]);

  const validatePassword = useCallback((): boolean => {
    if (!password) {
      setPasswordError(t('login.errors.passwordRequired'));
      return false;
    }
    setPasswordError('');
    return true;
  }, [password, t]);

  const validatePhone = useCallback((): boolean => {
    if (!phone.trim()) {
      setPhoneError(t('login.errors.phoneRequired'));
      return false;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setPhoneError(t('login.errors.phoneInvalid'));
      return false;
    }
    setPhoneError('');
    return true;
  }, [phone, t]);

  const handleEmailLogin = async () => {
    clearError();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    try {
      await loginEmail({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch {
      // Error is set in the store
    }
  };

  const handlePhoneLogin = async () => {
    clearError();
    if (!validatePhone()) return;

    try {
      const fullPhone = `+966${phone.trim()}`;
      await loginPhone({ phone: fullPhone });
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: fullPhone },
      });
    } catch {
      // Error is set in the store
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    Alert.alert(
      'Social Login',
      `${provider} login will be available soon. This requires native OAuth integration.`,
    );
  };

  const handleLogin = () => {
    if (activeTab === 'email') {
      handleEmailLogin();
    } else {
      handlePhoneLogin();
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AuthTab);
    clearError();
    setEmailError('');
    setPasswordError('');
    setPhoneError('');
  };

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
            {t('login.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('login.subtitle')}
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={[styles.socialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <SocialButton
            provider="google"
            title={t('login.socialGoogle').split(' ').pop() || 'Google'}
            onPress={() => handleSocialLogin('google')}
            disabled={isLoading}
          />
          <SocialButton
            provider="apple"
            title={t('login.socialApple').split(' ').pop() || 'Apple'}
            onPress={() => handleSocialLogin('apple')}
            disabled={isLoading}
          />
          <SocialButton
            provider="facebook"
            title={t('login.socialFacebook').split(' ').pop() || 'Facebook'}
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
            { key: 'email', label: t('login.emailTab') },
            { key: 'phone', label: t('login.phoneTab') },
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
              placeholder={t('login.emailPlaceholder')}
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
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!isLoading}
            />

            {/* Forgot Password */}
            <View style={[styles.forgotRow, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
              <Button
                title={t('login.forgotPassword')}
                onPress={() => router.push('/(auth)/forgot-password')}
                variant="ghost"
                size="sm"
                fullWidth={false}
                textStyle={styles.forgotText}
              />
            </View>
          </View>
        ) : (
          /* Phone Tab */
          <View>
            <Input
              label={t('common.phone')}
              placeholder={t('login.phonePlaceholder')}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                if (phoneError) setPhoneError('');
              }}
              error={phoneError}
              leftText={t('login.countryCode')}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={9}
              editable={!isLoading}
            />
          </View>
        )}

        {/* Login Button */}
        <Button
          title={t('login.loginButton')}
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={{ marginTop: spacing.sm }}
        />

        {/* Register Link */}
        <View style={styles.bottomLink}>
          <Text style={[styles.bottomLinkText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
            {t('login.noAccount')}{' '}
          </Text>
          <Button
            title={t('login.registerLink')}
            onPress={() => router.push('/(auth)/register')}
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
  forgotRow: {
    marginBottom: spacing.sm,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
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
});
