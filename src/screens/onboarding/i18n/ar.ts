import type { onboarding } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const onboardingAr: typeof onboarding = {
  title: 'مرحبًا بك في {{appName}}',
  body: 'استبدل هذه الشاشة بما يجب أن يعرفه المستخدم الجديد قبل تسجيل الدخول.',
  start: 'ابدأ الآن',
};
