import { productStrings } from '@entities/product'; // @unit:products
import { authStrings } from '@features/auth-by-credentials';
import { biometricStrings } from '@features/biometric-unlock'; // @unit:biometric-unlock
import { favoriteStrings } from '@features/toggle-favorite'; // @unit:products
import { versionGateStrings } from '@features/version-gate'; // @unit:version-gate
import { favoritesStrings } from '@screens/favorites'; // @unit:products
import { homeStrings } from '@screens/home';
import { onboardingStrings } from '@screens/onboarding'; // @unit:onboarding
import { productDetailsStrings } from '@screens/product-details'; // @unit:products
import { productListStrings } from '@screens/product-list'; // @unit:products
import { settingsStrings } from '@screens/settings';
import { common, initI18n } from '@shared/lib/i18n';

// Add a slice's strings here. Deleting a slice removes its line.
const namespaces = {
  common,
  auth: authStrings,
  biometric: biometricStrings, // @unit:biometric-unlock
  // @unit-start:products
  product: productStrings,
  favorite: favoriteStrings,
  favorites: favoritesStrings,
  productDetails: productDetailsStrings,
  productList: productListStrings,
  // @unit-end:products
  home: homeStrings,
  onboarding: onboardingStrings, // @unit:onboarding
  settings: settingsStrings,
  versionGate: versionGateStrings, // @unit:version-gate
};

initI18n(namespaces);

// Types every t() call against the English strings, so a misspelt key or
// namespace fails typecheck.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      [Name in keyof typeof namespaces]: (typeof namespaces)[Name]['en'];
    };
  }
}
