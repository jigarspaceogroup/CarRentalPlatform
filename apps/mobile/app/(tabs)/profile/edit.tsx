import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  I18nManager,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/stores/auth';
import { useProfile } from '../../../src/hooks/useProfile';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateProfile, uploadPhoto, isLoading } = useProfile();
  const isRTL = I18nManager.isRTL;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.drivingLicenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const handlePickImage = async () => {
    Alert.alert(
      t('profile.selectPhoto'),
      t('profile.selectPhotoMessage'),
      [
        {
          text: t('profile.camera'),
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: t('profile.gallery'),
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = t('profile.nameRequired');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('profile.emailInvalid');
    }

    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = t('profile.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      // Upload photo first if changed
      if (photoUri) {
        await uploadPhoto(photoUri);
      }

      // Check if email or phone changed (requires re-verification)
      const emailChanged = email !== user?.email;
      const phoneChanged = phone !== user?.phone;

      if (emailChanged || phoneChanged) {
        Alert.alert(
          t('profile.verificationRequired'),
          t('profile.verificationRequiredMessage'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.confirm'),
              onPress: async () => {
                await updateProfile({
                  name,
                  email: emailChanged ? email : undefined,
                  phone: phoneChanged ? phone : undefined,
                  drivingLicenseNumber: licenseNumber || undefined,
                  licenseExpiryDate: licenseExpiry || undefined,
                });

                Alert.alert(
                  t('common.success'),
                  emailChanged
                    ? t('profile.emailVerificationSent')
                    : t('profile.phoneVerificationSent'),
                  [
                    {
                      text: t('common.done'),
                      onPress: () => router.back(),
                    },
                  ],
                );
              },
            },
          ],
        );
      } else {
        await updateProfile({
          name,
          drivingLicenseNumber: licenseNumber || undefined,
          licenseExpiryDate: licenseExpiry || undefined,
        });

        Alert.alert(t('common.success'), t('profile.profileUpdated'), [
          {
            text: t('common.done'),
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('profile.updateFailed'),
      );
    }
  };

  const currentPhotoUri = photoUri || user?.avatar;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
        >
          <Text style={styles.backIcon}>{isRTL ? '\u203A' : '\u2039'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.editProfile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
            {currentPhotoUri ? (
              <Image source={{ uri: currentPhotoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>{t('profile.tapToChange')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('profile.fullName')}
            value={name}
            onChangeText={setName}
            placeholder={t('profile.fullNamePlaceholder')}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label={t('profile.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('profile.emailPlaceholder')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={t('profile.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('profile.phonePlaceholder')}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Input
            label={t('profile.licenseNumber')}
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder={t('profile.licenseNumberPlaceholder')}
          />

          <Input
            label={t('profile.licenseExpiry')}
            value={licenseExpiry}
            onChangeText={setLicenseExpiry}
            placeholder="YYYY-MM-DD"
          />

          <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.editProfileHint')}
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={isLoading}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonRTL: {
    alignItems: 'flex-end',
  },
  backIcon: {
    fontSize: 32,
    color: colors.gray[700],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 40,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  photoEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  photoEditIcon: {
    fontSize: 14,
  },
  photoHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  form: {
    paddingHorizontal: spacing.lg,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
