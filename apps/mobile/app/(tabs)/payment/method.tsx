import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../../src/theme';
import { useSavedCards } from '../../../src/hooks/useSavedCards';
import { useBookingStore } from '../../../src/stores/booking';
import { Button } from '../../../src/components/ui';
import api from '../../../src/lib/api';

type PaymentMethod = 'saved_card' | 'new_card' | 'cash';

function getCardBrandIcon(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'visa':
      return '\uD83D\uDCB3';
    case 'mastercard':
      return '\uD83D\uDCB3';
    case 'amex':
      return '\uD83D\uDCB3';
    default:
      return '\uD83D\uDCB3';
  }
}

export default function PaymentMethodScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const { cards, isLoading: cardsLoading } = useSavedCards();
  const store = useBookingStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('new_card');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectSavedCard = (cardId: string) => {
    setSelectedMethod('saved_card');
    setSelectedCardId(cardId);
  };

  const handlePayNow = async () => {
    if (!store.bookingId) return;

    if (selectedMethod === 'new_card') {
      router.push('/(tabs)/payment/card-form');
      return;
    }

    setIsProcessing(true);
    try {
      const payload: Record<string, string | undefined> = {
        bookingId: store.bookingId,
        method: selectedMethod === 'saved_card' ? 'SAVED_CARD' : 'CASH',
      };
      if (selectedMethod === 'saved_card' && selectedCardId) {
        payload.savedCardId = selectedCardId;
      }

      router.push('/(tabs)/payment/processing');

      const { data } = await api.post('/payments', payload);
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
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>{isRTL ? '\u2192' : '\u2190'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('payment.selectMethod')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saved Cards */}
        {cardsLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loadingSectionText}>{t('payment.loadingCards')}</Text>
          </View>
        ) : cards.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('payment.savedCards')}
            </Text>
            {cards.map((card) => {
              const isSelected =
                selectedMethod === 'saved_card' && selectedCardId === card.id;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                  onPress={() => handleSelectSavedCard(card.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.methodCardContent,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.cardBrandIcon}>
                      {getCardBrandIcon(card.brand)}
                    </Text>
                    <View style={styles.cardInfo}>
                      <Text
                        style={[
                          styles.cardBrand,
                          { textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {card.brand.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.cardNumber,
                          { textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        **** **** **** {card.last4}
                      </Text>
                      <Text style={styles.cardExpiry}>
                        {t('payment.expires')} {String(card.expiryMonth).padStart(2, '0')}/
                        {card.expiryYear}
                      </Text>
                    </View>
                    {card.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>
                          {t('payment.default')}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Add New Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('payment.otherMethods')}
          </Text>

          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'new_card' && styles.methodCardSelected,
            ]}
            onPress={() => {
              setSelectedMethod('new_card');
              setSelectedCardId(null);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.methodCardContent,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={styles.radioOuter}>
                {selectedMethod === 'new_card' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.methodIcon}>{'\uD83D\uDCB3'}</Text>
              <View style={styles.methodInfo}>
                <Text
                  style={[
                    styles.methodTitle,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {t('payment.addNewCard')}
                </Text>
                <Text
                  style={[
                    styles.methodSubtitle,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {t('payment.addNewCardDesc')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'cash' && styles.methodCardSelected,
            ]}
            onPress={() => {
              setSelectedMethod('cash');
              setSelectedCardId(null);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.methodCardContent,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={styles.radioOuter}>
                {selectedMethod === 'cash' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.methodIcon}>{'\uD83D\uDCB5'}</Text>
              <View style={styles.methodInfo}>
                <Text
                  style={[
                    styles.methodTitle,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {t('payment.cashOnDelivery')}
                </Text>
                <Text
                  style={[
                    styles.methodSubtitle,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {t('payment.cashOnDeliveryDesc')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pay Now Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          title={
            selectedMethod === 'new_card'
              ? t('payment.continueToCard')
              : t('payment.payNow')
          }
          onPress={handlePayNow}
          loading={isProcessing}
          disabled={
            isProcessing ||
            (selectedMethod === 'saved_card' && !selectedCardId)
          }
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
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingSectionText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  methodCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.gray[100],
  },
  methodCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  methodCardContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  cardBrandIcon: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  cardNumber: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cardExpiry: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  defaultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[100],
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  methodIcon: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  methodSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
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
