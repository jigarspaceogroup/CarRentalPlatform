import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../src/theme';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
];

export default function LanguageSettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === selectedLanguage) {
      return;
    }

    const language = LANGUAGES.find((lang) => lang.code === languageCode);
    if (!language) return;

    Alert.alert(
      t('profile.changeLanguage'),
      t('profile.changeLanguageConfirm', { language: language.nativeName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              // Save language preference
              await AsyncStorage.setItem('app_language', languageCode);

              // Update i18n
              await i18n.changeLanguage(languageCode);

              // Update RTL layout if needed
              const shouldBeRTL = language.isRTL;
              if (I18nManager.isRTL !== shouldBeRTL) {
                I18nManager.forceRTL(shouldBeRTL);

                // Show restart alert
                Alert.alert(
                  t('profile.restartRequired'),
                  t('profile.restartRequiredMessage'),
                  [
                    {
                      text: t('common.confirm'),
                      onPress: async () => {
                        // Reload the app
                        if (Updates.isEnabled) {
                          await Updates.reloadAsync();
                        }
                      },
                    },
                  ],
                  { cancelable: false },
                );
              } else {
                setSelectedLanguage(languageCode);
                Alert.alert(t('common.success'), t('profile.languageChanged'), [
                  {
                    text: t('common.done'),
                    onPress: () => router.back(),
                  },
                ]);
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error instanceof Error ? error.message : t('profile.languageChangeFailed'),
              );
            }
          },
        },
      ],
    );
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
        <Text style={styles.title}>{t('profile.language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Language Options */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('profile.selectLanguage')}
        </Text>

        {LANGUAGES.map((language) => {
          const isSelected = language.code === selectedLanguage;

          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                isSelected && styles.languageOptionSelected,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <View style={[styles.languageInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.languageName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language.nativeName}
                </Text>
                <Text style={[styles.languageCode, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language.name}
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                  { marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 },
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.hintContainer}>
          <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.languageHint')}
          </Text>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  languageOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  languageCode: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary[600],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },
  hintContainer: {
    marginTop: spacing.lg,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    lineHeight: 18,
  },
});
