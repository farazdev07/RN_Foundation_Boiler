import type { settings } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const settingsAr: typeof settings = {
  title: 'الإعدادات',
  appearance: 'المظهر',
  system: 'مطابقة النظام',
  light: 'فاتح',
  dark: 'داكن',
  language: 'اللغة',
  account: 'الحساب',
  logout: 'تسجيل الخروج',
  logoutTitle: 'تسجيل الخروج؟',
  logoutMessage: 'ستحتاج إلى تسجيل الدخول مرة أخرى.',
};
