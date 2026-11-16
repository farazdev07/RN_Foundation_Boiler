import type { versionGate } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const versionGateAr: typeof versionGate = {
  updateRequiredTitle: 'التحديث مطلوب',
  updateRequiredMessage:
    'هذا الإصدار من {{appName}} لم يعد مدعومًا. حدّث التطبيق للمتابعة.',
  updateAvailableTitle: 'يتوفر تحديث',
  updateAvailableMessage: 'يتوفر إصدار أحدث من {{appName}}.',
  update: 'تحديث',
  later: 'لاحقًا',
  maintenanceTitle: 'سنعود قريبًا',
  maintenanceMessage: '{{appName}} متوقف للصيانة. حاول مرة أخرى بعد قليل.',
};
