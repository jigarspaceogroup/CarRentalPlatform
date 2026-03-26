import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager, Platform } from 'react-native';

import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const initialLanguage = deviceLocale === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export function changeLanguage(lang: 'en' | 'ar'): void {
  const isRTL = lang === 'ar';
  i18n.changeLanguage(lang);

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);

    // On native platforms, RTL changes require a restart to take full effect.
    // The app should handle this gracefully (e.g., prompt user or auto-restart).
    if (Platform.OS !== 'web') {
      // expo-updates or RNRestart can be used here.
      // For now, the layout direction is applied on next app launch.
    }
  }
}

export function isRTL(): boolean {
  return i18n.language === 'ar';
}

export function currentLanguage(): 'en' | 'ar' {
  return i18n.language === 'ar' ? 'ar' : 'en';
}

export default i18n;
