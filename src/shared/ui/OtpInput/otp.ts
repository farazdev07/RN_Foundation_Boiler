// Keeps digits only and at most `cellCount` of them, so a pasted
// "123 456" or an SMS autofill with extra text still fills the cells.
export const sanitizeCode = (text: string, cellCount: number): string =>
  text.replace(/\D/g, '').slice(0, cellCount);

// The cell the next digit goes into; the last one once the code is full.
export const activeCell = (code: string, cellCount: number): number =>
  Math.min(code.length, cellCount - 1);
