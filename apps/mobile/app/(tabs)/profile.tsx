import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, fontWeight } from '../../src/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // The store clears local state regardless
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{t('tabs.profile')}</Text>
      <View style={styles.content}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() ||
              user?.email?.charAt(0)?.toUpperCase() ||
              'U'}
          </Text>
        </View>
        <Text style={styles.welcomeText}>
          {t('home.welcome', { name: user?.name || user?.email || 'User' })}
        </Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={t('home.logout')}
          onPress={handleLogout}
          variant="outline"
          size="lg"
          loading={isLoading}
          textStyle={styles.logoutText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  welcomeText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    textAlign: 'center',
  },
  bottom: {
    paddingVertical: spacing.lg,
  },
  logoutText: {
    color: colors.red[500],
  },
});
