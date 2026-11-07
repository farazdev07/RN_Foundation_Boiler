import { authStrings } from '@features/auth-by-credentials';
import { biometricStrings } from '@features/biometric-unlock'; // @unit:biometric-unlock
import { homeStrings } from '@screens/home';
import { settingsStrings } from '@screens/settings';
import { common, initI18n } from '@shared/lib/i18n';

// Add a slice's strings here. Deleting a slice removes its line.
initI18n({
  common,
  auth: authStrings,
  biometric: biometricStrings, // @unit:biometric-unlock
  home: homeStrings,
  settings: settingsStrings,
});
