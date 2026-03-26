import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const { updateProfile, user, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone?.replace('+966', '') || '');
  const [license, setLicense] = useState(user?.drivingLicenseNumber || '');
  const [nameError, setNameError] = useState('');

  // Determine which fields to show based on registration method
  const showEmail = !user?.email;
  const showPhone = !user?.phone;

  const handleComplete = async () => {
    clearError();

    if (!name.trim()) {
      setNameError(t('profileCompletion.errors.nameRequired'));
      return;
    }
    setNameError('');

    try {
      const payload: {
        name: string;
        email?: string;
        phone?: string;
        drivingLicenseNumber?: string;
      } = {
        name: name.trim(),
      };

      if (showEmail && email.trim()) {
        payload.email = email.trim();
      }
      if (showPhone && phone.trim()) {
        payload.phone = `+966${phone.trim()}`;
      }
      if (license.trim()) {
        payload.drivingLicenseNumber = license.trim();
      }

      await updateProfile(payload);
      router.replace('/(tabs)');
    } catch {
      // Error is set in the store
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handlePhotoPress = () => {
    // Photo upload would use expo-image-picker in a real implementation
    Alert.alert(
      'Photo Upload',
      'Photo upload will be available soon. This requires expo-image-picker integration.',
    );
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
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profileCompletion.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profileCompletion.subtitle')}
          </Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity
          onPress={handlePhotoPress}
          style={styles.avatarContainer}
          activeOpacity={0.7}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>{'\uD83D\uDCF7'}</Text>
          </View>
          <Text style={styles.avatarLabel}>{t('profileCompletion.photoLabel')}</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <Input
          label={t('profileCompletion.fullNameLabel')}
          placeholder={t('profileCompletion.fullNamePlaceholder')}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError('');
          }}
          error={nameError}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          editable={!isLoading}
        />

        {showEmail ? (
          <Input
            label={t('profileCompletion.emailLabel')}
            placeholder={t('profileCompletion.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!isLoading}
          />
        ) : null}

        {showPhone ? (
          <Input
            label={t('profileCompletion.phoneLabel')}
            placeholder={t('profileCompletion.phonePlaceholder')}
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
            leftText="+966"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={9}
            editable={!isLoading}
          />
        ) : null}

        <Input
          label={t('profileCompletion.licenseLabel')}
          placeholder={t('profileCompletion.licensePlaceholder')}
          value={license}
          onChangeText={setLicense}
          autoCapitalize="characters"
          editable={!isLoading}
        />

        {/* Complete Button */}
        <Button
          title={t('profileCompletion.completeButton')}
          onPress={handleComplete}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          style={{ marginTop: spacing.md }}
        />

        {/* Skip */}
        <Button
          title={t('profileCompletion.skip')}
          onPress={handleSkip}
          variant="ghost"
          size="md"
          textStyle={styles.skipText}
          style={{ marginTop: spacing.sm }}
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  avatarIcon: {
    fontSize: 32,
  },
  avatarLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
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
  skipText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
});
