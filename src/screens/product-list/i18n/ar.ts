import type { productList } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const productListAr: typeof productList = {
  title: 'المنتجات',
  searchPlaceholder: 'ابحث عن منتجات',
  emptyTitle: 'لم يُعثر على منتجات',
  emptySearch: 'لا توجد نتائج لـ «{{query}}».',
  errorTitle: 'تعذّر تحميل المنتجات',
  retry: 'حاول مرة أخرى',
};
