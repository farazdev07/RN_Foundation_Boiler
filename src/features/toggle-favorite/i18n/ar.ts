import type { favorite } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const favoriteAr: typeof favorite = {
  add: 'إضافة إلى المفضلة',
  remove: 'إزالة من المفضلة',
  added: 'تمت الإضافة إلى المفضلة',
  removed: 'تمت الإزالة من المفضلة',
};
