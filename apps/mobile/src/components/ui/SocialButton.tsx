import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '../../theme';

type SocialProvider = 'google' | 'apple' | 'facebook';

interface SocialButtonProps {
  provider: SocialProvider;
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const providerIcons: Record<SocialProvider, { letter: string; color: string }> = {
  google: { letter: 'G', color: '#DB4437' },
  apple: { letter: '', color: colors.black },
  facebook: { letter: 'f', color: '#1877F2' },
};

export default function SocialButton({
  provider,
  title,
  onPress,
  loading = false,
  disabled = false,
}: SocialButtonProps) {
  const icon = providerIcons[provider];
  const isRTL = I18nManager.isRTL;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.container,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.gray[600]} />
      ) : (
        <>
          <View style={[styles.iconContainer, { backgroundColor: icon.color + '12' }]}>
            <Text style={[styles.iconText, { color: icon.color }]}>{icon.letter}</Text>
          </View>
          <Text
            style={[
              styles.text,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    minHeight: 48,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
