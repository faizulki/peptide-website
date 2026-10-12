import { CartItem } from '@/types';

// Flat shipping per order, in EUR — must match SHIPPING_FEE_EUR in
// backend/src/orders/orders.service.ts, which is what's actually charged.
export const SHIPPING_FEE_EUR = 7;

// Same rule as the backend: free only when every item is flagged free-shipping.
export function shippingFor(items: CartItem[]): number {
  if (items.length === 0) return 0;
  return items.every((item) => item.product?.freeShipping) ? 0 : SHIPPING_FEE_EUR;
}
