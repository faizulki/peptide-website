import { ServiceUnavailableException } from '@nestjs/common';
import { isAxiosError } from 'axios';

// Errors the storefront recognizes by `code` and shows as a translated,
// customer-friendly message instead of "Internal server error".

export class PaymentProviderUnavailableException extends ServiceUnavailableException {
  constructor() {
    super({
      statusCode: 503,
      error: 'Service Unavailable',
      code: 'PAYMENT_PROVIDER_UNAVAILABLE',
      message:
        'The payment provider is not responding right now. Please try again in a few minutes.',
    });
  }
}

export class CurrencyRateUnavailableException extends ServiceUnavailableException {
  constructor(currency: string) {
    super({
      statusCode: 503,
      error: 'Service Unavailable',
      code: 'CURRENCY_RATE_UNAVAILABLE',
      message: `Payment in ${currency} is temporarily unavailable. Please choose EUR or try again in a few minutes.`,
    });
  }
}

// One-line description of a failed outgoing request for the logs: which
// endpoint, the HTTP status and the start of the response body. Logging
// the raw AxiosError instead dumps thousands of lines (sockets, headers,
// the full request config with its parameters) for every failure.
export function describeRequestError(err: unknown): string {
  if (isAxiosError(err)) {
    const url = err.config?.url ?? 'unknown URL';
    if (err.response) {
      const body =
        typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data ?? '');
      return `${url} → HTTP ${err.response.status}: ${body.slice(0, 200)}`;
    }
    return `${url} → ${err.code ?? 'network error'}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}
