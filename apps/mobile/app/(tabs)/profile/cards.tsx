import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useSavedCards } from '../../../src/hooks/useSavedCards';
import api from '../../../src/lib/api';
import Button from '../../../src/components/ui/Button';
import EmptyState from '../../../src/components/EmptyState';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';
import type { SavedCard } from '../../../src/types/booking';

interface CardItemProps {
  card: SavedCard;
  onDelete: () => void;
  isRTL: boolean;
}

function CardItem({ card, onDelete, isRTL }: CardItemProps) {
  const { t } = useTranslation();

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeButton, styles.swipeButtonDelete]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Text style={styles.swipeButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={[styles.cardItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{getCardIcon(card.brand)}</Text>
        </View>
        <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardBrand, { textAlign: isRTL ? 'right' : 'left' }]}>
              {card.brand} •••• {card.last4}
            </Text>
            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{t('profile.default')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardExpiry, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('payment.expires')}: {card.expiryMonth.toString().padStart(2, '0')}/
            {card.expiryYear}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

export default function SavedCardsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cards, isLoading, refetch } = useSavedCards();
  const isRTL = I18nManager.isRTL;

  const handleDelete = (card: SavedCard) => {
    Alert.alert(
      t('profile.deleteCard'),
      t('profile.deleteCardConfirm', { last4: card.last4 }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/saved-cards/${card.id}`);
              await refetch();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error instanceof Error ? error.message : t('profile.deleteFailed'),
              );
            }
          },
        },
      ],
    );
  };

  const handleAddNew = () => {
    router.push('/profile/card-form' as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

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
        <Text style={styles.title}>{t('profile.savedCards')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {cards.length === 0 ? (
        <EmptyState
          title={t('profile.noCards')}
          subtitle={t('profile.noCardsSubtitle')}
          actionLabel={t('profile.addCard')}
          onAction={handleAddNew}
        />
      ) : (
        <>
          <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardItem card={item} onDelete={() => handleDelete(item)} isRTL={isRTL} />
            )}
            contentContainerStyle={styles.listContent}
          />

          {/* Add Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <Button
              title={t('profile.addCard')}
              onPress={handleAddNew}
              variant="outline"
              size="lg"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    paddingVertical: spacing.sm,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardBrand: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  defaultBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary[700],
  },
  cardExpiry: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeButton: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeButtonDelete: {
    backgroundColor: colors.red[500],
  },
  swipeButtonText: {
    fontSize: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
