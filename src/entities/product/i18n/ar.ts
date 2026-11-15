import type { product } from './en';

// Typed against the English strings, so a missing or extra key fails typecheck.
export const productAr: typeof product = {
  rating: 'التقييم {{rating}} من 5',
};
