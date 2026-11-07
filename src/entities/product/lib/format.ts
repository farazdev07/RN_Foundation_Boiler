import { formatCurrency } from '@shared/lib/number';

// dummyjson prices are US dollars.
export const formatPrice = (price: number): string =>
  formatCurrency(price, 'USD');
