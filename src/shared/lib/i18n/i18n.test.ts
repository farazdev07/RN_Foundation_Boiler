import { I18nManager } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { createMMKV } from 'react-native-mmkv';
import {
  common,
  i18next,
  initI18n,
  isRtlLanguage,
  setLanguage,
  useDirection,
} from '@shared/lib/i18n';

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
    expect(i18next.t('close')).toBe('إغلاق');
    expect(i18next.t('settings:title')).toBe('Settings');
  });

  it('remembers the chosen language', () => {
    setLanguage('ar');

    expect(createMMKV({ id: 'device' }).getString('i18n.language')).toBe(
      '{"v":1,"d":"ar"}',
    );
  });

  it('flips the layout direction at once, and sets it for the next launch', async () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);

    const { result } = await renderHook(() => useDirection());
    expect(result.current).toBe('ltr');

    await act(() => setLanguage('ar'));

    expect(result.current).toBe('rtl');
    expect(forceRTL).toHaveBeenLastCalledWith(true);

    await act(() => setLanguage('en'));

    expect(result.current).toBe('ltr');
    expect(forceRTL).toHaveBeenLastCalledWith(false);
  });
});
