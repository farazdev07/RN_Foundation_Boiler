import { settingsStrings } from '@screens/settings';
import { common, initI18n } from '@shared/lib/i18n';

// Add a slice's strings here. Deleting a slice removes its line.
initI18n({ common, settings: settingsStrings });
