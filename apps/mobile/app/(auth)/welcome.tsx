import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { changeLanguage, currentLanguage } from '../../src/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const handleLanguageToggle = () => {
    const newLang = currentLanguage() === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Language Toggle */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.spacer} />
        <Button
          title={t('welcome.language')}
          onPress={handleLanguageToggle}
          variant="ghost"
          size="sm"
          fullWidth={false}
          textStyle={styles.languageButtonText}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>CR</Text>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>{t('welcome.appName')}</Text>
        <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
      </View>

      {/* Bottom Actions */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <Button
          title={t('welcome.getStarted')}
          onPress={() => router.push('/(auth)/register')}
          variant="primary"
          size="lg"
        />

        <Button
          title={t('welcome.login')}
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          size="md"
          textStyle={styles.loginLinkText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[600],
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  languageButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.primary[200],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  loginLinkText: {
    color: colors.primary[100],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
