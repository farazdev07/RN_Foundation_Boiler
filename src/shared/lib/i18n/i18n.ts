import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import { z } from 'zod';
import { defineKey } from '@shared/storage';

const SUPPORTED_LANGUAGES = ['en'] as const;

type Language = (typeof SUPPORTED_LANGUAGES)[number];
type Namespaces = Record<string, Record<string, unknown>>;

const languageKey = defineKey({
  name: 'i18n.language',
  schema: z.enum(SUPPORTED_LANGUAGES),
  version: 1,
  kind: 'user',
  scope: 'device',
});

const detectLanguage = (): Language =>
  languageKey.get() ??
  findBestLanguageTag(SUPPORTED_LANGUAGES)?.languageTag ??
  'en';

// Each slice owns its strings and app passes them all in here, so deleting a
// slice deletes its strings too.
export const initI18n = (namespaces: Namespaces): void => {
  if (i18next.isInitialized) {
    return;
  }

  i18next.use(initReactI18next).init({
    lng: detectLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: Object.keys(namespaces),
    resources: { en: namespaces },
    interpolation: { escapeValue: false },
    initAsync: false,
  });
};

export const setLanguage = (language: Language): void => {
  languageKey.set(language);
  i18next.changeLanguage(language);
};

export { i18next };
