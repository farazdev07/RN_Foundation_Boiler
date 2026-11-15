import { I18nManager } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import {
  common,
  i18next,
  initI18n,
  isRtlLanguage,
  setLanguage,
} from '@shared/lib/i18n';
import { isDirectionPending } from './i18n';

const settings = {
  en: { title: 'Settings', language: 'Language' },
  // No Arabic on purpose: a slice may ship English first.
};

describe('i18n', () => {
  const forceRTL = jest.spyOn(I18nManager, 'forceRTL');

  beforeAll(() => {
    createMMKV({ id: 'device' }).clearAll();
    initI18n({ common, settings });
  });

  afterEach(() => {
    setLanguage('en');
  });

  it('translates from the default namespace and from a slice namespace', () => {
    expect(i18next.t('cancel')).toBe('Cancel');
    expect(i18next.t('settings:title')).toBe('Settings');
  });

  it('keeps the first setup when called again', () => {
    initI18n({ common: { en: { ...common.en, cancel: 'Replaced' } } });

    expect(i18next.t('cancel')).toBe('Cancel');
  });

  it('switches to Arabic, and falls back to English where a slice has no Arabic', () => {
    setLanguage('ar');

    expect(i18next.t('cancel')).toBe('إلغاء');
    expect(i18next.t('slidePosition', { current: 2, total: 3 })).toBe(
      'الشريحة 2 من 3',
    );
    expect(i18next.t('settings:title')).toBe('Settings');
  });

  it('remembers the chosen language', () => {
    setLanguage('ar');

    expect(createMMKV({ id: 'device' }).getString('i18n.language')).toBe(
      '{"v":1,"d":"ar"}',
    );
  });

  it('asks for a right-to-left layout for Arabic, and says a restart is pending', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);

    setLanguage('ar');

    expect(forceRTL).toHaveBeenLastCalledWith(true);
    // The running app keeps its direction until it restarts.
    expect(I18nManager.isRTL).toBe(false);
    expect(isDirectionPending()).toBe(true);

    setLanguage('en');

    expect(forceRTL).toHaveBeenLastCalledWith(false);
    expect(isDirectionPending()).toBe(false);
  });
});
