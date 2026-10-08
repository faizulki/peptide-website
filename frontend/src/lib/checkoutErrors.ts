import { ApiError } from '@/lib/api';
import type { TranslationKey } from '@/lib/translations';

// What to tell a customer when starting a payment fails. Known backend
// failures get a translated, actionable message; server errors and network
// problems get a friendly generic one instead of "Internal server error";
// anything else (e.g. "Insufficient stock for …") is shown as sent.
export function checkoutErrorMessage(err: unknown, t: (key: TranslationKey) => string): string {
  if (err instanceof ApiError) {
    if (err.code === 'PAYMENT_PROVIDER_UNAVAILABLE' || err.code === 'UPSTREAM_UNAVAILABLE') {
      return t('checkout.providerUnavailable');
    }
    if (err.code === 'CURRENCY_RATE_UNAVAILABLE') {
      return t('checkout.currencyUnavailable');
    }
    if (err.status >= 500) {
      return t('checkout.failedGeneric');
    }
    return err.message;
  }
  // fetch() itself failed — offline, or the server couldn't be reached.
  return t('checkout.failedGeneric');
}
