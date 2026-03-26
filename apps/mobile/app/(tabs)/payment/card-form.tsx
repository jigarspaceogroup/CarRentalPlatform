import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useBookingStore } from '../../../src/stores/booking';
import { Button, Input } from '../../../src/components/ui';
import api from '../../../src/lib/api';

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return cleaned;
}

function validateCardNumber(value: string): boolean {
  const cleaned = value.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned);
}

function validateExpiry(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month);
  return expDate > now;
}

function validateCVV(value: string): boolean {
  return /^\d{3,4}$/.test(value);
}

export default function CardFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;
  const store = useBookingStore();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    setCardNumber(formatCardNumber(raw));
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    }
  };

  const handleExpiryChange = (text: string) => {
    // Handle deletion of the slash
    if (text.length < expiry.length && expiry.endsWith('/')) {
      setExpiry(text.replace(/\D/g, '').slice(0, 2));
      return;
    }
    const raw = text.replace(/\D/g, '').slice(0, 4);
    setExpiry(formatExpiry(raw));
    if (errors.expiry) {
      setErrors((prev) => ({ ...prev, expiry: undefined }));
    }
  };

  const handleCvvChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
    if (errors.cvv) {
      setErrors((prev) => ({ ...prev, cvv: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const cleanedCard = cardNumber.replace(/\s/g, '');

    if (!validateCardNumber(cleanedCard)) {
      newErrors.cardNumber = t('payment.invalidCardNumber');
    }
    if (!validateExpiry(expiry)) {
      newErrors.expiry = t('payment.invalidExpiry');
    }
    if (!validateCVV(cvv)) {
      newErrors.cvv = t('payment.invalidCVV');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    if (!store.bookingId) return;

    setIsSubmitting(true);

    try {
      // In production, card number would be tokenized via Stripe/payment SDK.
      // For now, we send a mock token.
      const cardToken = `tok_${Date.now()}`;

      router.push('/(tabs)/payment/processing');

      const { data } = await api.post('/payments', {
        bookingId: store.bookingId,
        method: 'CARD',
        cardToken,
      });
      const result = data.data ?? data;

      if (result.status === 'SUCCESS') {
        router.replace('/(tabs)/payment/confirmation');
      } else {
        router.replace({
          pathname: '/(tabs)/payment/failed',
          params: { error: result.errorMessage || t('payment.genericError') },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('payment.genericError');
      router.replace({
        pathname: '/(tabs)/payment/failed',
        params: { error: message },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const totalAmount = store.pricing?.total ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('payment.cardDetails')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewTop}>
            <Text style={styles.cardPreviewBrand}>{'\uD83D\uDCB3'}</Text>
            <Text style={styles.cardPreviewChip}>{'\u2B1B'}</Text>
          </View>
          <Text style={styles.cardPreviewNumber}>
            {cardNumber || '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022'}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <Text style={styles.cardPreviewExpiry}>
              {expiry || 'MM/YY'}
            </Text>
          </View>
        </View>

        {/* Card Number */}
        <Input
          label={t('payment.cardNumber')}
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="number-pad"
          maxLength={19}
          error={errors.cardNumber}
        />

        {/* Expiry and CVV Row */}
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label={t('payment.expiry')}
              placeholder="MM/YY"
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="number-pad"
              maxLength={5}
              error={errors.expiry}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label={t('payment.cvv')}
              placeholder="CVV"
              value={cvv}
              onChangeText={handleCvvChange}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              error={errors.cvv}
            />
          </View>
        </View>

        {/* Save Card Checkbox */}
        <TouchableOpacity
          style={[
            styles.saveCardRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          onPress={() => setSaveCard(!saveCard)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              saveCard && styles.checkboxChecked,
            ]}
          >
            {saveCard && <Text style={styles.checkboxMark}>{'\u2713'}</Text>}
          </View>
          <Text style={[styles.saveCardText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('payment.saveThisCard')}
          </Text>
        </TouchableOpacity>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.securityText}>
            {t('payment.securityNote')}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={`${t('payment.pay')} ${totalAmount > 0 ? `${totalAmount.toFixed(2)} SAR` : ''}`}
          onPress={handlePay}
          loading={isSubmitting}
          disabled={isSubmitting}
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.gray[800],
    fontWeight: fontWeight.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  cardPreview: {
    backgroundColor: colors.primary[700],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewBrand: {
    fontSize: 28,
  },
  cardPreviewChip: {
    fontSize: 20,
    color: colors.primary[300],
  },
  cardPreviewNumber: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: fontWeight.medium,
    letterSpacing: 2,
    marginVertical: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardPreviewExpiry: {
    fontSize: fontSize.sm,
    color: colors.primary[200],
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  saveCardRow: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxMark: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  saveCardText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  securityIcon: {
    fontSize: 18,
  },
  securityText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
});
