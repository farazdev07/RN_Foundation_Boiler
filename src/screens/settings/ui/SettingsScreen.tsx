import { useTranslation } from '@shared/lib/i18n';
import {
  RadioGroup,
  Screen,
  useThemePreference,
  type ThemePreference,
} from '@shared/ui';

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const { preference, setPreference } = useThemePreference();

  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('system') },
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
  ];

  return (
    <Screen belowHeader scrollable>
      <RadioGroup
        label={t('appearance')}
        options={options}
        value={preference}
        onChange={setPreference}
      />
    </Screen>
  );
}
