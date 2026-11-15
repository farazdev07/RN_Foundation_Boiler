import type { productDetails } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const productDetailsAr: typeof productDetails = {
  errorTitle: 'تعذّر تحميل هذا المنتج',
  retry: 'حاول مرة أخرى',
  offline: 'ستظهر التفاصيل عند عودة الاتصال.',
  inStock: '{{count}} متوفر',
  outOfStock: 'غير متوفر',
  openImage: 'الصورة {{index}} من {{count}}، تفتح بملء الشاشة',
  closeImage: 'إغلاق',
};
