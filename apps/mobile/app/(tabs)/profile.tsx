import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  I18nManager,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/theme';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isRTL: boolean;
  isDanger?: boolean;
}

function MenuItem({ icon, label, onPress, isRTL, isDanger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.menuItem,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text
        style={[
          styles.menuLabel,
          isDanger && styles.menuLabelDanger,
          { textAlign: isRTL ? 'right' : 'left' },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.menuArrow, { marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }]}>
        {isRTL ? '\u203A' : '\u203A'}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const isRTL = I18nManager.isRTL;

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              // The store clears local state regardless
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('tabs.profile')}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  'U'}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{user?.name || t('profile.guest')}</Text>
          <Text style={styles.userContact}>
            {user?.email || user?.phone || ''}
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.accountSettings')}
          </Text>

          <MenuItem
            icon="✏️"
            label={t('profile.editProfile')}
            onPress={() => router.push('/profile/edit' as any)}
            isRTL={isRTL}
          />
          <MenuItem
            icon="📍"
            label={t('profile.savedAddresses')}
            onPress={() => router.push('/profile/addresses' as any)}
            isRTL={isRTL}
          />
          <MenuItem
            icon="💳"
            label={t('profile.savedCards')}
            onPress={() => router.push('/profile/cards' as any)}
            isRTL={isRTL}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.preferences')}
          </Text>

          <MenuItem
            icon="🌐"
            label={t('profile.language')}
            onPress={() => router.push('/profile/language' as any)}
            isRTL={isRTL}
          />
          <MenuItem
            icon="🔔"
            label={t('profile.notifications')}
            onPress={() => router.push('/(tabs)/notifications' as any)}
            isRTL={isRTL}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.legal')}
          </Text>

          <MenuItem
            icon="📄"
            label={t('profile.termsConditions')}
            onPress={() => {
              // TODO: Navigate to terms screen or open web view
              Alert.alert(t('profile.termsConditions'), t('profile.comingSoon'));
            }}
            isRTL={isRTL}
          />
          <MenuItem
            icon="🔒"
            label={t('profile.privacyPolicy')}
            onPress={() => {
              // TODO: Navigate to privacy screen or open web view
              Alert.alert(t('profile.privacyPolicy'), t('profile.comingSoon'));
            }}
            isRTL={isRTL}
          />
          <MenuItem
            icon="ℹ️"
            label={t('profile.about')}
            onPress={() => {
              // TODO: Navigate to about screen
              Alert.alert(t('profile.about'), t('profile.comingSoon'));
            }}
            isRTL={isRTL}
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="🚪"
            label={t('profile.logout')}
            onPress={handleLogout}
            isRTL={isRTL}
            isDanger
          />
        </View>

        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  userContact: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  menuSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: fontSize.md,
    color: colors.gray[900],
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  menuLabelDanger: {
    color: colors.red[500],
  },
  menuArrow: {
    fontSize: 24,
    color: colors.gray[400],
  },
});
