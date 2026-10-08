import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  CurrencyRateUnavailableException,
  describeRequestError,
} from '../payment/payment-errors';

interface PayGateConvertResponse {
  status: string;
  value_coin: string;
  exchange_rate: string;
}

interface CachedRate {
  usdPerUnit: number;
  fetchedAt: number;
}

// How long a fetched FX rate is trusted before re-querying PayGate. Rates
// don't need to be real-time for product browsing or checkout provider
// selection, and this keeps us from hammering their API on every request.
const RATE_TTL_MS = 10 * 60 * 1000;

// When PayGate can't be reached, a previously fetched rate is still used —
// fiat rates barely move in a day — but never one older than this.
const MAX_STALE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly cache = new Map<string, CachedRate>();

  // Low-level primitive: USD value of 1 unit of `currency`. PayGate's own
  // convert.php is USD-denominated at the source (there's no way to ask it
  // for EUR-relative rates directly), so every EUR-relative rate below is
  // built by composing two of these calls. Returns null when no usable rate
  // exists — never a made-up one.
  async getUsdRate(currency: string): Promise<number | null> {
    const code = currency.toUpperCase();
    if (code === 'USD') {
      return 1;
    }

    const cached = this.cache.get(code);
    if (cached && Date.now() - cached.fetchedAt < RATE_TTL_MS) {
      return cached.usdPerUnit;
    }

    try {
      const res = await axios.get<PayGateConvertResponse>(
        'https://api.paygate.to/control/convert.php',
        { params: { from: code, value: 1 }, timeout: 10_000 },
      );
      const rate = parseFloat(res.data.exchange_rate);
      if (!rate || Number.isNaN(rate)) {
        throw new Error(`Invalid exchange rate for ${code}`);
      }
      this.cache.set(code, { usdPerUnit: rate, fetchedAt: Date.now() });
      return rate;
    } catch (err) {
      // Guessing (the old 1:1 fallback) would charge a customer paying in
      // SEK roughly a tenth of the real price, so without a reasonably
      // fresh rate the currency is simply reported as unavailable.
      const usable = cached && Date.now() - cached.fetchedAt < MAX_STALE_MS;
      this.logger.warn(
        `FX rate for ${code} unavailable (${describeRequestError(err)}); ` +
          (usable ? 'using last known rate' : 'no usable rate'),
      );
      return usable ? cached.usdPerUnit : null;
    }
  }

  // EUR value of 1 unit of `currency` — the base-currency rate everything
  // else in the app is built on. EUR itself is always exactly 1 with no
  // network call, which is what keeps EUR-denominated prices from ever
  // drifting just by being displayed or resaved.
  async getEurRate(currency: string): Promise<number | null> {
    const code = currency.toUpperCase();
    if (code === 'EUR') {
      return 1;
    }
    const [usdX, usdEur] = await Promise.all([this.getUsdRate(code), this.getUsdRate('EUR')]);
    if (usdX === null || usdEur === null) {
      return null;
    }
    return usdX / usdEur;
  }

  // Returns { [currencyCode]: eurValueOfOneUnit } for every requested code
  // that has a usable rate. Currencies without one are left out, and the
  // storefront then shows those prices in EUR rather than wrongly converted.
  async getRates(currencies: string[]): Promise<Record<string, number>> {
    const uniqueCodes = [...new Set(currencies.map((c) => c.toUpperCase()))];
    const entries = await Promise.all(
      uniqueCodes.map(async (code) => [code, await this.getEurRate(code)] as const),
    );
    return Object.fromEntries(
      entries.filter((entry): entry is readonly [string, number] => entry[1] !== null),
    );
  }

  // Converts a EUR amount (our stored base currency) into `currency` —
  // used only at the payment-gateway boundary, when a customer has chosen
  // to pay in something other than EUR.
  async convertFromEur(eurAmount: number, currency: string): Promise<number> {
    const code = currency.toUpperCase();
    if (code === 'EUR') {
      return eurAmount;
    }
    const rate = await this.getEurRate(code);
    if (rate === null) {
      throw new CurrencyRateUnavailableException(code);
    }
    return eurAmount / rate;
  }
}
