import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { sw, en } from '@fundi-wangu/i18n-strings';
import ENV from './env';

i18n.use(initReactI18next).init({
  resources: {
    sw: { translation: sw },
    en: { translation: en },
  },
  lng: ENV.DEFAULT_LANGUAGE,
  fallbackLng: 'sw',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
