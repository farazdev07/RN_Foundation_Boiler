import type { auth } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const authAr: typeof auth = {
  welcome: 'مرحبًا بعودتك',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  rememberMe: 'تذكرني',
  signIn: 'تسجيل الدخول',
  required: 'مطلوب',
};
