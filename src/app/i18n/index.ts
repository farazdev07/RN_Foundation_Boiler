import { authStrings } from '@features/auth-by-credentials';
import { homeStrings } from '@screens/home';
import { settingsStrings } from '@screens/settings';
import { common, initI18n } from '@shared/lib/i18n';

// Add a slice's strings here. Deleting a slice removes its line.
initI18n({
  common,
  auth: authStrings,
  home: homeStrings,
  settings: settingsStrings,
});
