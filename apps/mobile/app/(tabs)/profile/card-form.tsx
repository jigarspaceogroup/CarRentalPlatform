import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import api from '../../../src/lib/api';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { colors, spacing, fontSize, fontWeight } from '../../../src/theme';

export default function CardFormScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setExpiry(formatExpiry(cleaned));
    }
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setCvv(cleaned);
    }
  };

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  };

  const validateExpiry = (exp: string): boolean => {
    const parts = exp.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = t('payment.invalidCardNumber');
    }

    if (!validateExpiry(expiry)) {
      newErrors.expiry = t('payment.invalidExpiry');
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = t('payment.invalidCVV');
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
      // In production, this would tokenize the card via the payment gateway SDK
      // For now, we'll simulate the tokenization
      const expiryParts = expiry.split('/');
      const payload = {
        cardToken: 'tok_' + Date.now(), // Mock token
        last4: cardNumber.replace(/\s/g, '').slice(-4),
        brand: detectCardBrand(cardNumber),
        expiryMonth: parseInt(expiryParts[0], 10),
        expiryYear: parseInt('20' + expiryParts[1], 10),
        isDefault,
      };

      await api.post('/saved-cards', payload);

      Alert.alert(t('common.success'), t('profile.cardAdded'), [
        {
          text: t('common.done'),
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('profile.cardSaveFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return 'unknown';
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
        <Text style={styles.title}>{t('profile.addCard')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input
            label={t('payment.cardNumber')}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            error={errors.cardNumber}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label={t('payment.expiry')}
                value={expiry}
                onChangeText={handleExpiryChange}
                placeholder="MM/YY"
                error={errors.expiry}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label={t('payment.cvv')}
                value={cvv}
                onChangeText={handleCvvChange}
                placeholder="123"
                error={errors.cvv}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>

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
                {t('profile.setAsDefaultCardHint')}
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
              thumbColor={isDefault ? colors.primary[600] : colors.gray[400]}
            />
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={[styles.securityText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('payment.securityNote')}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={t('profile.addCard')}
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
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.gray[600],
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
