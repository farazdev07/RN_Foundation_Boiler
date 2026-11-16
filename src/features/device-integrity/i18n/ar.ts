import type { deviceIntegrity } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const deviceIntegrityAr: typeof deviceIntegrity = {
  blockedTitle: 'هذا الجهاز غير مدعوم',
  blockedMessage:
    'لا يمكن تشغيل {{appName}} على جهاز مكسور الحماية (روت أو جيلبريك)، لأن بياناتك لن تكون آمنة.',
  warnTitle: 'قد لا يكون هذا الجهاز آمنًا',
  warnMessage:
    'يبدو أن الجهاز مكسور الحماية. قد تتمكن تطبيقات أخرى من قراءة بياناتك في {{appName}}.',
  acknowledge: 'فهمت',
};
