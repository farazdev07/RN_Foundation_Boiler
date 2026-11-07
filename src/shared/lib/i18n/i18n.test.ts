import { createMMKV } from 'react-native-mmkv';
import { i18next, initI18n, setLanguage } from '@shared/lib/i18n';

describe('i18n', () => {
  beforeAll(() => {
    createMMKV({ id: 'device' }).clearAll();
    initI18n({
      common: { greeting: 'Hello {{name}}' },
      settings: { title: 'Settings' },
    });
  });

  it('translates from the default namespace', () => {
    expect(i18next.t('greeting', { name: 'Sam' })).toBe('Hello Sam');
  });

  it('translates from a slice namespace', () => {
    expect(i18next.t('settings:title')).toBe('Settings');
  });

  it('keeps the first setup when called again', () => {
    initI18n({ common: { greeting: 'Replaced' } });

    expect(i18next.t('greeting', { name: 'Sam' })).toBe('Hello Sam');
  });

  it('remembers the chosen language', () => {
    setLanguage('en');

    expect(createMMKV({ id: 'device' }).getString('i18n.language')).toBe(
      '{"v":1,"d":"en"}',
    );
  });
});
