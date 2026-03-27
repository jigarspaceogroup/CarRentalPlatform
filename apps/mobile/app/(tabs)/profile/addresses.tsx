import React, { useState } from 'react';
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
import { useAddresses, type Address } from '../../../src/hooks/useAddresses';
import Button from '../../../src/components/ui/Button';
import EmptyState from '../../../src/components/EmptyState';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

interface AddressItemProps {
  address: Address;
  onDelete: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  isRTL: boolean;
}

function AddressItem({ address, onDelete, onEdit, onSetDefault, isRTL }: AddressItemProps) {
  const { t } = useTranslation();

  const renderRightActions = () => (
    <View style={[styles.swipeActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TouchableOpacity
        style={[styles.swipeButton, styles.swipeButtonEdit]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <Text style={styles.swipeButtonText}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeButton, styles.swipeButtonDelete]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Text style={styles.swipeButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.addressItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <View style={[styles.addressContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.addressHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.addressLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {address.label}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{t('profile.default')}</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.addressText, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {address.addressLine1}
            {address.addressLine2 ? `, ${address.addressLine2}` : ''}
          </Text>
          <Text style={[styles.addressCity, { textAlign: isRTL ? 'right' : 'left' }]}>
            {address.city}
            {address.postalCode ? ` ${address.postalCode}` : ''}
          </Text>
          {!address.isDefault && (
            <TouchableOpacity onPress={onSetDefault} style={styles.setDefaultButton}>
              <Text style={styles.setDefaultText}>{t('profile.setAsDefault')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function SavedAddressesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addresses, isLoading, deleteAddress, setDefaultAddress } = useAddresses();
  const isRTL = I18nManager.isRTL;

  const handleDelete = (address: Address) => {
    Alert.alert(
      t('profile.deleteAddress'),
      t('profile.deleteAddressConfirm', { label: address.label }),
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
              await deleteAddress(address.id);
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

  const handleSetDefault = async (address: Address) => {
    try {
      await setDefaultAddress(address.id);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('profile.setDefaultFailed'),
      );
    }
  };

  const handleAddNew = () => {
    if (addresses.length >= 10) {
      Alert.alert(t('profile.maxAddresses'), t('profile.maxAddressesMessage'));
      return;
    }
    router.push('/profile/address-form' as any);
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
        <Text style={styles.title}>{t('profile.savedAddresses')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {addresses.length === 0 ? (
        <EmptyState
          title={t('profile.noAddresses')}
          subtitle={t('profile.noAddressesSubtitle')}
          actionLabel={t('profile.addAddress')}
          onAction={handleAddNew}
        />
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AddressItem
                address={item}
                onDelete={() => handleDelete(item)}
                onEdit={() => router.push(`/profile/address-form?id=${item.id}` as any)}
                onSetDefault={() => handleSetDefault(item)}
                isRTL={isRTL}
              />
            )}
            contentContainerStyle={styles.listContent}
          />

          {/* Add Button */}
          {addresses.length < 10 && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
              <Button
                title={t('profile.addAddress')}
                onPress={handleAddNew}
                variant="outline"
                size="lg"
              />
            </View>
          )}
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
  addressItem: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  addressLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
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
  addressText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  addressCity: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  setDefaultButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
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
  swipeButtonEdit: {
    backgroundColor: colors.primary[600],
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
