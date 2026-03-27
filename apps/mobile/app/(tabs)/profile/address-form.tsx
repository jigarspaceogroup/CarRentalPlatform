import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAddresses } from '../../../src/hooks/useAddresses';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { colors, spacing, fontSize, fontWeight } from '../../../src/theme';

const LABEL_OPTIONS = ['Home', 'Work', 'Other'];

export default function AddressFormScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addresses, createAddress, updateAddress } = useAddresses();
  const isRTL = I18nManager.isRTL;

  const addressId = params.id as string | undefined;
  const isEditing = !!addressId;
  const existingAddress = addresses.find((a) => a.id === addressId);

  const [label, setLabel] = useState(existingAddress?.label || 'Home');
  const [addressLine1, setAddressLine1] = useState(existingAddress?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(existingAddress?.addressLine2 || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [postalCode, setPostalCode] = useState(existingAddress?.postalCode || '');
  const [isDefault, setIsDefault] = useState(existingAddress?.isDefault || false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    addressLine1?: string;
    city?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!addressLine1.trim()) {
      newErrors.addressLine1 = t('profile.addressLine1Required');
    }

    if (!city.trim()) {
      newErrors.city = t('profile.cityRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const addressData = {
        label,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        postalCode: postalCode || undefined,
        isDefault,
      };

      if (isEditing && addressId) {
        await updateAddress(addressId, addressData);
        Alert.alert(t('common.success'), t('profile.addressUpdated'), [
          {
            text: t('common.done'),
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createAddress(addressData);
        Alert.alert(t('common.success'), t('profile.addressAdded'), [
          {
            text: t('common.done'),
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('profile.addressSaveFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.title}>
          {isEditing ? t('profile.editAddress') : t('profile.addAddress')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Label Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.addressLabel')}
          </Text>
          <View style={styles.labelOptions}>
            {LABEL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.labelOption,
                  label === option && styles.labelOptionActive,
                ]}
                onPress={() => setLabel(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.labelOptionText,
                    label === option && styles.labelOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Fields */}
        <View style={styles.form}>
          <Input
            label={t('profile.addressLine1')}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder={t('profile.addressLine1Placeholder')}
            error={errors.addressLine1}
            multiline
          />

          <Input
            label={t('profile.addressLine2')}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder={t('profile.addressLine2Placeholder')}
            multiline
          />

          <Input
            label={t('profile.city')}
            value={city}
            onChangeText={setCity}
            placeholder={t('profile.cityPlaceholder')}
            error={errors.city}
          />

          <Input
            label={t('profile.postalCode')}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder={t('profile.postalCodePlaceholder')}
            keyboardType="numeric"
          />

          {/* Set as Default */}
          <View
            style={[
              styles.switchRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.switchLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.switchLabelText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('profile.setAsDefault')}
              </Text>
              <Text style={[styles.switchLabelHint, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('profile.setAsDefaultHint')}
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
              thumbColor={isDefault ? colors.primary[600] : colors.gray[400]}
            />
          </View>

          <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.addressFormHint')}
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={isEditing ? t('common.save') : t('profile.addAddress')}
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
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  labelOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  labelOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 8,
    alignItems: 'center',
  },
  labelOptionActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  labelOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  labelOptionTextActive: {
    color: colors.primary[700],
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginTop: spacing.md,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  switchLabelHint: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
