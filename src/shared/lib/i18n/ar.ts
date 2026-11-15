import type { commonEn } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const commonAr: typeof commonEn = {
  appName: 'RN Foundation',
  retry: 'حاول مرة أخرى',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  errorTitle: 'حدث خطأ ما',
  offline: 'أنت غير متصل بالإنترنت',
  empty: 'لا يوجد شيء هنا بعد',
  close: 'إغلاق',
  done: 'تم',
  loading: 'جارٍ التحميل',
  search: 'بحث',
  select: 'اختر',
  showPassword: 'إظهار كلمة المرور',
  hidePassword: 'إخفاء كلمة المرور',
  toastHint: 'اسحب للأعلى أو اضغط للإخفاء',
  errorNetwork: 'تحقق من اتصالك وحاول مرة أخرى.',
  errorTimeout: 'استغرق الطلب وقتًا طويلًا. حاول مرة أخرى.',
  errorGeneric: 'حدث خطأ ما. حاول مرة أخرى.',
  // @unit-start:carousel
  slidePosition: 'الشريحة {{current}} من {{total}}',
  // @unit-end:carousel
  // @unit-start:range-slider
  rangeSummary: 'من {{from}} إلى {{to}}',
  rangeMinimum: 'الحد الأدنى {{label}}',
  rangeMaximum: 'الحد الأقصى {{label}}',
  // @unit-end:range-slider
  // @unit-start:date-time
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  markedDay: 'مميّز',
  // @unit-end:date-time
  // @unit-start:phone-input
  searchCountry: 'ابحث عن دولة أو رمز',
  chooseCountry: 'اختر الدولة',
  // @unit-end:phone-input
};
