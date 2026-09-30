'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { CryptoCoinOption } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface CryptoPaymentFlowProps {
  orderId: string;
  coins: CryptoCoinOption[];
}

const POLL_INTERVAL_MS = 5000;

function networkLabel(coin: CryptoCoinOption): string {
  if (!coin.network) return coin.ticker === 'btc' ? 'Bitcoin' : 'Ethereum';
  return coin.network.toUpperCase();
}

export default function CryptoPaymentFlow({ orderId, coins }: CryptoPaymentFlowProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoinOption | null>(null);
  const [payment, setPayment] = useState<{ address: string; amountCoin: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q),
    );
  }, [coins, search]);

  const handleSelectCoin = async (coin: CryptoCoinOption) => {
    setSelectedCoin(coin);
    setError('');
    setLoadingAddress(true);
    try {
      const result = await api.selectCryptoCoin(orderId, coin.path);
      setPayment({ address: result.address, amountCoin: result.amountCoin });
    } catch (err: any) {
      setError(err.message || 'Failed to generate a payment address for this coin');
      setSelectedCoin(null);
    } finally {
      setLoadingAddress(false);
    }
  };

  // Renders the deposit address as a scannable QR code once we have one.
  useEffect(() => {
    if (!payment) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(payment.address, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [payment]);

  // Polls the same status check PayGate's own callback would trigger — this
  // page has no way to know the customer sent the payment, so it just asks
  // periodically until PayGate confirms it.
  useEffect(() => {
    if (!payment) return;

    pollRef.current = setInterval(async () => {
      try {
        const status = await api.checkPaymentStatus(orderId);
        if (status.processed) {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push('/checkout/success');
        }
      } catch {
        // Transient network hiccups shouldn't stop polling — just try again
        // on the next tick.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [payment, orderId, router]);

  const handleCopy = async () => {
    if (!payment) return;
    await navigator.clipboard.writeText(payment.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (payment && selectedCoin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('crypto.send')} {selectedCoin.name} ({selectedCoin.ticker.toUpperCase()})
        </h1>
        <p className="text-gray-600 mb-6">
          {t('crypto.sendDesc').replace('{network}', networkLabel(selectedCoin))}
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Payment address QR code" className="rounded-lg border border-gray-200" />
          )}

          <div className="flex-1 w-full space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('crypto.amount')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {payment.amountCoin} {selectedCoin.ticker.toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('crypto.address')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all bg-gray-100 rounded px-3 py-2 text-sm text-gray-900">
                  {payment.address}
                </code>
                <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? t('crypto.copied') : t('crypto.copy')}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              {t('crypto.waitingForPayment')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('crypto.payWithCrypto')}</h1>
      <p className="text-gray-600 mb-6">
        {t('crypto.chooseCoinDesc')}
      </p>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <Input
        type="text"
        placeholder={t('crypto.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <div className="max-h-96 overflow-y-auto space-y-1 border border-gray-200 rounded-lg">
        {filteredCoins.length === 0 && (
          <p className="text-sm text-gray-500 p-4">{t('crypto.noCoinsMatch')}</p>
        )}
        {filteredCoins.map((coin) => (
          <button
            key={coin.path}
            type="button"
            disabled={loadingAddress}
            onClick={() => handleSelectCoin(coin)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coin.logo} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
            <span className="flex-1">
              <span className="block font-medium text-gray-900">{coin.name}</span>
              <span className="block text-xs text-gray-500">
                {coin.ticker.toUpperCase()} · {networkLabel(coin)}
              </span>
            </span>
            {loadingAddress && selectedCoin?.path === coin.path && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
