import type { biometric } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const biometricAr: typeof biometric = {
  toggle: 'الفتح بالبصمة أو الوجه',
  hint: 'اطلب Face ID أو بصمة الإصبع عند فتح التطبيق.',
  needsRememberMe: 'سجّل الدخول مع تفعيل «تذكرني» لاستخدام هذه الميزة.',
  prompt: 'فتح {{appName}}',
  enableFailed: 'تعذّر تفعيل الفتح بالبصمة.',
};
