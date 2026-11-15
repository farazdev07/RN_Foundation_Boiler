import type { favorites } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const favoritesAr: typeof favorites = {
  title: 'المفضلة',
  emptyTitle: 'لا توجد عناصر مفضلة بعد',
  emptyMessage: 'اضغط على القلب في أي منتج لحفظه هنا، حتى بدون اتصال.',
};
