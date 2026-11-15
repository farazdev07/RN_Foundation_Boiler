import { I18nManager } from 'react-native';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import { z } from 'zod';
import { defineKey } from '@shared/storage';
import { commonAr } from './ar';
import { commonEn } from './en';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const RTL_LANGUAGES: ReadonlySet<Language> = new Set(['ar']);

// Each language in its own script, so a user can find theirs whatever the
// current language is. These are names, not translations.
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ar: 'العربية',
};

// English is required and is the fallback. A slice adds another language by
// adding `i18n/<language>.ts`, typed as `typeof` its English strings.
export type LocalizedStrings<T = Record<string, unknown>> = {
  en: T;
} & Partial<Record<Language, T>>;

type Namespaces = Record<string, LocalizedStrings>;

export const common = { en: commonEn, ar: commonAr };

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

export const isRtlLanguage = (language: Language): boolean =>
  RTL_LANGUAGES.has(language);

// React Native reads this once, when the app starts, so it only sets what the
// next start uses for native views. The running app is flipped by `useDirection`:
// every root view sets it as its `direction` style, which lays out at once.
const applyDirection = (language: Language): void => {
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
};

const currentLanguage = (): Language => {
  const parsed = z.enum(SUPPORTED_LANGUAGES).safeParse(i18next.language);
  return parsed.success ? parsed.data : 'en';
};

// Turns { auth: { en, ar } } into i18next's { en: { auth }, ar: { auth } }.
const toResources = (namespaces: Namespaces) =>
  Object.fromEntries(
    SUPPORTED_LANGUAGES.map(language => [
      language,
      Object.fromEntries(
        Object.entries(namespaces).flatMap(([name, strings]) => {
          const translated = strings[language];
          return translated ? [[name, translated]] : [];
        }),
      ),
    ]),
  );

// Each slice owns its strings and app passes them all in here, so deleting a
// slice deletes its strings too.
export const initI18n = (namespaces: Namespaces): void => {
  if (i18next.isInitialized) {
    return;
  }

  const language = detectLanguage();
  i18next.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: Object.keys(namespaces),
    resources: toResources(namespaces),
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  applyDirection(language);
};

export const setLanguage = (language: Language): void => {
  languageKey.set(language);
  applyDirection(language);
  i18next.changeLanguage(language);
};

// For a language picker. Re-renders when the language changes.
export const useLanguage = () => {
  useTranslation();
  return { language: currentLanguage(), setLanguage };
};

export type Direction = 'ltr' | 'rtl';

// The layout direction of the current language. Use this, not
// `I18nManager.isRTL`, which keeps the value the app started with.
export const useDirection = (): Direction => {
  useTranslation();
  return isRtlLanguage(currentLanguage()) ? 'rtl' : 'ltr';
};

export { i18next };
