import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  PaymentGateway,
  NormalizedPaymentEvent,
  PaymentProviderOption,
  CryptoCoinOption,
} from './payment-gateway.interface';
import { PaymentProviderUnavailableException, describeRequestError } from './payment-errors';

interface PayGateWalletResponse {
  address_in: string;
  polygon_address_in: string;
  callback_url: string;
  ipn_token: string;
}

interface PayGateCryptoCoinInfo {
  coin: string;
  logo: string;
  ticker: string;
  minimum_transaction_coin: number;
}

// crypto/info.php returns a flat map of either a coin directly (btc, eth, ...)
// or a network grouping containing several coins (bep20: { usdc: {...}, ... }).
type PayGateCryptoInfoResponse = Record<
  string,
  PayGateCryptoCoinInfo | Record<string, PayGateCryptoCoinInfo>
>;

interface PayGateStatusResponse {
  status: string;
  value_coin?: string;
  txid_out?: string;
  coin?: string;
}

interface PayGateProviderEntry {
  id: string;
  provider_name: string;
  status: string;
  minimum_currency: string;
  minimum_amount: number;
}

interface PayGateProviderStatusResponse {
  providers: PayGateProviderEntry[];
}

// Client-requested exclusions — PayGate's own hosted multi-provider page
// (pay.php) has no way to hide specific providers from it, so instead we
// build our own curated list of single-provider links (process-payment.php
// with an explicit &provider=), which does skip straight past the selector.
const EXCLUDED_PROVIDER_IDS = [
  'coinbase',
  'revolut',
  'transak',
  'alchemypay',
  'binance',
  'blockchaincom',
  'particle',
  'sardine',
  'paypal',
  'robinhood',
  'cashapp',
  'ideal',
];

// Per PayGate's docs, these providers are hard-locked to one settlement
// currency regardless of amount — offering them to a customer paying in
// any other currency would just fail on PayGate's end.
const CURRENCY_LOCKED_PROVIDERS: Record<string, string> = {
  stripe: 'USD',
  transfi: 'USD',
  robinhood: 'USD',
  bitnovo: 'USD',
  upi: 'INR',
  interac: 'CAD',
};

const PROVIDER_CACHE_TTL_MS = 10 * 60 * 1000;
const CRYPTO_INFO_CACHE_TTL_MS = 60 * 60 * 1000;

// Only chains/networks we actually hold a wallet for — PAYGATE_BTC_WALLET
// covers native Bitcoin, PAYGATE_MERCHANT_WALLET is a single EVM address
// valid across every one of these networks. Solana, Tron, Monero, Litecoin,
// etc. would each need their own dedicated wallet we don't have, so those
// entries from crypto/info.php are left out of the picker entirely.
const SUPPORTED_EVM_NETWORKS = [
  'bep20',
  'erc20',
  'arbitrum',
  'polygon',
  'avax-c',
  'bera',
  'base',
  'optimism',
  'linea',
  'monad',
];

@Injectable()
export class PayGateService implements PaymentGateway {
  private readonly logger = new Logger(PayGateService.name);
  private readonly apiUrl = 'https://api.paygate.to';
  private readonly checkoutUrl = 'https://checkout.paygate.to';
  private readonly merchantWallet: string;
  private readonly btcWallet: string;
  private providerCache: { data: PayGateProviderEntry[]; fetchedAt: number } | null = null;
  private cryptoInfoCache: { data: PayGateCryptoInfoResponse; fetchedAt: number } | null = null;
  // PayGate's WAF rejects anything that doesn't look like a real browser
  // request from its own site — no auth token involved, just these headers.
  // (Confirmed by trial and error: axios's default UA alone gets rejected
  // even with Referer/Origin set.)
  private readonly headers = {
    Referer: 'https://paygate.to/',
    Origin: 'https://paygate.to',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  };

  constructor(private configService: ConfigService) {
    this.merchantWallet =
      this.configService.get<string>('PAYGATE_MERCHANT_WALLET') || '';
    this.btcWallet = this.configService.get<string>('PAYGATE_BTC_WALLET') || '';
  }

  // Every PayGate API call goes through here. When PayGate is down or
  // rejects the request (it had an hour-long outage answering everything
  // with "400 Bad request method!"), this logs one line saying what failed
  // and throws an error the storefront shows as "try again in a few
  // minutes" — rather than an unhandled AxiosError surfacing to the
  // customer as "Internal server error".
  private async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const timeout = 15_000;
    try {
      const res = await axios.get<T>(`${this.apiUrl}${path}`, {
        params,
        headers: this.headers,
        timeout,
      });
      return res.data;
    } catch (err) {
      this.logger.error(`PayGate request failed: ${describeRequestError(err)}`);
      throw new PaymentProviderUnavailableException();
    }
  }

  private async getActiveProviders(): Promise<PayGateProviderEntry[]> {
    if (this.providerCache && Date.now() - this.providerCache.fetchedAt < PROVIDER_CACHE_TTL_MS) {
      return this.providerCache.data;
    }
    try {
      const data = await this.get<PayGateProviderStatusResponse>('/control/provider-status');
      this.providerCache = { data: data.providers, fetchedAt: Date.now() };
      return data.providers;
    } catch {
      // Stale cache beats none; if we've never fetched successfully the
      // caller just gets an empty curated list and falls back to pay.php.
      return this.providerCache?.data ?? [];
    }
  }

  // Builds one process-payment.php link per eligible provider — this is
  // what actually excludes coinbase/revolut, since pay.php can't.
  private async buildProviderOptions(
    addressIn: string,
    amount: number,
    currency: string,
    email: string,
  ): Promise<PaymentProviderOption[]> {
    const providers = await this.getActiveProviders();
    const params = new URLSearchParams({
      address: addressIn,
      amount: amount.toFixed(2),
      currency,
      email,
    });

    return providers
      .filter((p) => p.status === 'active')
      .filter((p) => !EXCLUDED_PROVIDER_IDS.includes(p.id))
      .filter((p) => {
        const lockedCurrency = CURRENCY_LOCKED_PROVIDERS[p.id];
        return !lockedCurrency || lockedCurrency === currency;
      })
      .filter((p) => p.minimum_currency !== currency || amount >= p.minimum_amount)
      .map((p) => {
        const providerParams = new URLSearchParams(params);
        providerParams.set('provider', p.id);
        return {
          id: p.id,
          name: p.provider_name,
          url: `${this.checkoutUrl}/process-payment.php?${providerParams.toString()}`,
        };
      });
  }

  async createPaymentRequest(
    orderId: string,
    amount: number,
    currency = 'EUR',
    customerEmail?: string,
  ): Promise<{ paymentUrl: string; requestId: string; providers?: PaymentProviderOption[] }> {
    if (!this.merchantWallet) {
      throw new BadRequestException('PayGate merchant wallet is not configured');
    }

    const appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    // Mints a one-time tracking address for this order; PayGate forwards
    // whatever crypto lands on it straight to our merchant wallet.
    const wallet = await this.get<PayGateWalletResponse>('/control/wallet.php', {
      address: this.merchantWallet,
      callback: `${appUrl}/api/webhooks/paygate?orderId=${encodeURIComponent(orderId)}`,
    });
    this.assertWalletResponse(wallet);

    // wallet.php returns address_in/ipn_token already URL-encoded (they're
    // designed to be dropped straight into the next URL's query string).
    // Decoding once here means every downstream use — URLSearchParams here,
    // axios params in verifyPayment — can encode normally without anything
    // needing to know it was pre-encoded, avoiding double-encoding bugs.
    const addressIn = decodeURIComponent(wallet.address_in);
    const ipnToken = decodeURIComponent(wallet.ipn_token);

    const email = customerEmail || 'guest@eupeptides.org';

    // pay.php is PayGate's own hosted multi-provider selector (Transak,
    // Banxa, Stripe, etc.) — a plain redirect URL, not an API call. Kept as
    // a fallback for when the curated provider list can't be built (e.g.
    // provider-status is unreachable), since it needs no extra API calls.
    const params = new URLSearchParams({
      address: addressIn,
      amount: amount.toFixed(2),
      currency,
      email,
    });

    const providers = await this.buildProviderOptions(addressIn, amount, currency, email);

    return {
      paymentUrl: `${this.checkoutUrl}/pay.php?${params.toString()}`,
      // ipn_token is what lets us independently verify payment later —
      // stored as the order's paymentRequestId.
      requestId: ipnToken,
      providers: providers.length > 0 ? providers : undefined,
    };
  }

  private async getCryptoInfo(): Promise<PayGateCryptoInfoResponse> {
    if (this.cryptoInfoCache && Date.now() - this.cryptoInfoCache.fetchedAt < CRYPTO_INFO_CACHE_TTL_MS) {
      return this.cryptoInfoCache.data;
    }
    const data = await this.get<PayGateCryptoInfoResponse>('/crypto/info.php');
    this.cryptoInfoCache = { data, fetchedAt: Date.now() };
    return data;
  }

  /**
   * For customers who already hold crypto and want to pay directly from
   * their own wallet — a genuinely different rail from createPaymentRequest,
   * which always routes through a card/onramp provider. Lists every
   * BTC/EVM coin our two merchant wallets can actually receive, for our own
   * coin-picker UI (PayGate's hosted picker can't be embedded/customized).
   */
  async getCryptoCoinOptions(): Promise<CryptoCoinOption[]> {
    const info = await this.getCryptoInfo();
    const options: CryptoCoinOption[] = [];
    const isCoinInfo = (v: unknown): v is PayGateCryptoCoinInfo =>
      !!v && typeof v === 'object' && 'ticker' in (v as object);

    if (this.btcWallet && isCoinInfo(info.btc)) {
      options.push({ path: 'btc', network: null, ticker: 'btc', name: info.btc.coin, logo: info.btc.logo });
    }

    if (this.merchantWallet) {
      if (isCoinInfo(info.eth)) {
        options.push({ path: 'eth', network: null, ticker: 'eth', name: info.eth.coin, logo: info.eth.logo });
      }
      for (const network of SUPPORTED_EVM_NETWORKS) {
        const group = info[network];
        if (!group || isCoinInfo(group)) continue;
        for (const [ticker, coin] of Object.entries(group)) {
          options.push({ path: `${network}/${ticker}`, network, ticker, name: coin.coin, logo: coin.logo });
        }
      }
    }

    return options;
  }

  /**
   * Generates the actual on-chain deposit address for one specific coin the
   * customer picked, plus how much of it to send. Unlike wallet.php/
   * multi-hosted-wallet.php, this per-coin endpoint returns a real address
   * directly rather than an obfuscated forwarding token.
   */
  async createCryptoAddressForCoin(
    orderId: string,
    coinPath: string,
    amountEur: number,
  ): Promise<{ address: string; amountCoin: string; ipnToken: string }> {
    const isBtc = coinPath === 'btc';
    const wallet = isBtc ? this.btcWallet : this.merchantWallet;
    if (!wallet) {
      throw new BadRequestException('PayGate wallet is not configured for this coin');
    }

    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    const [walletRes, convertRes] = await Promise.all([
      this.get<PayGateWalletResponse>(`/crypto/${coinPath}/wallet.php`, {
        address: wallet,
        callback: `${appUrl}/api/webhooks/paygate?orderId=${encodeURIComponent(orderId)}`,
      }),
      // amountEur is the order's stored total, which is EUR (our base currency).
      this.get<{ status: string; value_coin: string }>(`/crypto/${coinPath}/convert.php`, {
        from: 'EUR',
        value: amountEur,
      }),
    ]);
    this.assertWalletResponse(walletRes);

    // Same pre-encoded-value caveat as the card-flow wallet.php — decoding
    // defensively here is a safe no-op if this endpoint ever returns a
    // plain (unencoded) address instead.
    const address = decodeURIComponent(walletRes.address_in);
    const ipnToken = decodeURIComponent(walletRes.ipn_token);

    if (convertRes.status !== 'success') {
      throw new BadRequestException('Could not price this order in the selected coin');
    }

    return { address, amountCoin: convertRes.value_coin, ipnToken };
  }

  /**
   * PayGate's callback is an unsigned GET request with no verification
   * mechanism at all — anyone who guesses the callback URL could forge one.
   * So it's never trusted directly; the webhooks controller uses this
   * method to independently ask PayGate "is this order actually paid?"
   * using the ipn_token we minted ourselves and stored server-side.
   */
  async verifyPayment(ipnToken: string): Promise<NormalizedPaymentEvent | null> {
    const status = await this.get<PayGateStatusResponse>('/control/payment-status.php', {
      ipn_token: ipnToken,
    });

    if (status.status !== 'paid') {
      return null;
    }

    return {
      orderId: '', // filled in by the controller from the callback's orderId query param
      transactionId: status.txid_out,
      status: 'paid',
    };
  }

  // A 200 response without the expected fields would otherwise turn into
  // decodeURIComponent(undefined) → the literal string "undefined" being
  // handed to the customer as a payment address.
  private assertWalletResponse(wallet: PayGateWalletResponse): void {
    if (!wallet?.address_in || !wallet?.ipn_token) {
      this.logger.error(
        `PayGate wallet response missing address_in/ipn_token: ${JSON.stringify(wallet).slice(0, 200)}`,
      );
      throw new PaymentProviderUnavailableException();
    }
  }

  async parseWebhook(): Promise<NormalizedPaymentEvent | null> {
    // PayGate doesn't do signed POST webhooks — see verifyPayment() and the
    // dedicated GET /webhooks/paygate route instead.
    throw new BadRequestException(
      'PayGate does not use signature-based webhooks; use verifyPayment()',
    );
  }
}
