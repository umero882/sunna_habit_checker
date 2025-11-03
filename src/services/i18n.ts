/**
 * i18n Configuration
 * Supports English and Arabic with RTL handling
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

import enCommon from '../locales/en/common.json';
import arCommon from '../locales/ar/common.json';

export const resources = {
  en: {
    common: enCommon,
  },
  ar: {
    common: arCommon,
  },
} as const;

export type Language = keyof typeof resources;

// Detect device locale
const getDeviceLocale = (): Language => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode;

  // Check if Arabic
  if (languageCode === 'ar') {
    return 'ar';
  }

  // Default to English
  return 'en';
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLocale(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
});

// Handle RTL layout
export const setLanguage = async (language: Language) => {
  const isRTL = language === 'ar';

  // Update i18n language
  await i18n.changeLanguage(language);

  // Update RTL layout if needed
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // Note: App needs to restart for RTL changes to take full effect
    // You may want to show a message to the user
  }
};

export const isRTL = () => {
  return i18n.language === 'ar';
};

export default i18n;
