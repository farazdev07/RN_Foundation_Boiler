import type { home } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const homeAr: typeof home = {
  title: 'الرئيسية',
  greeting: 'مرحبًا، {{name}}',
  errorTitle: 'تعذّر تحميل ملفك الشخصي',
};
