'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CURRENCY_OPTIONS, DISPLAY_CURRENCY } from '@/contexts/CurrencyContext';
import { CheckoutData, CryptoCoinOption } from '@/types';
import { api } from '@/lib/api';
import Container from '@/components/layout/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import OrderSummary from '@/components/cart/OrderSummary';
import CryptoPaymentFlow from '@/components/checkout/CryptoPaymentFlow';

const countryOptions = [
  { value: 'Sweden', label: { en: 'Sweden', sv: 'Sverige' } },
  { value: 'Finland', label: { en: 'Finland', sv: 'Finland' } },
  { value: 'Norway', label: { en: 'Norway', sv: 'Norge' } },
  { value: 'Denmark', label: { en: 'Denmark', sv: 'Danmark' } },
  { value: 'Germany', label: { en: 'Germany', sv: 'Tyskland' } },
  { value: 'United Kingdom', label: { en: 'United Kingdom', sv: 'Storbritannien' } },
  { value: 'France', label: { en: 'France', sv: 'Frankrike' } },
  { value: 'Spain', label: { en: 'Spain', sv: 'Spanien' } },
  { value: 'Portugal', label: { en: 'Portugal', sv: 'Portugal' } },
  { value: 'Serbia', label: { en: 'Serbia', sv: 'Serbien' } },
];

const DEFAULT_FORM_DATA: CheckoutData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Sweden',
  paymentType: 'card',
  currency: DISPLAY_CURRENCY,
};

// Keeps whatever the customer has typed so a refresh or an accidental
// navigation away (e.g. bouncing off the payment page) doesn't force them
// to redo the whole form.
const DRAFT_STORAGE_KEY = 'checkoutFormDraft';
const DRAFT_TTL_MS = 30 * 60 * 1000;

function loadDraft(): CheckoutData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveDraft(data: CheckoutData) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export default function CheckoutPage() {
  const { cart, loading: cartLoading, getTotalPrice } = useCart();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const localizedCountryOptions = countryOptions.map((c) => ({
    value: c.value,
    label: c.label[language],
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CheckoutData>(
    () => loadDraft() || DEFAULT_FORM_DATA,
  );
  const [providerOptions, setProviderOptions] = useState<
    { id: string; name: string; url: string }[] | null
  >(null);
  const [cryptoCheckout, setCryptoCheckout] = useState<
    { orderId: string; coins: CryptoCoinOption[] } | null
  >(null);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const guestId = localStorage.getItem('guestId');
      if (!guestId) {
        throw new Error(t('checkout.missingCartSession'));
      }

      const response = await api.checkout(formData, guestId);
      clearDraft();
      // Deliberately not clearing the cart here — PayGate has no browser
      // return URL, so if the customer abandons or the payment fails,
      // this is the only way they keep their cart instead of it vanishing.

      if (response.cryptoCoins && response.cryptoCoins.length > 0) {
        // Our own coin-picker UI, replacing PayGate's hosted crypto page.
        setCryptoCheckout({ orderId: response.order.id, coins: response.cryptoCoins });
        setLoading(false);
      } else if (response.providers && response.providers.length > 0) {
        // A curated provider list (see backend) — shown instead of
        // PayGate's own selector so we can leave specific providers out.
        setProviderOptions(response.providers);
        setLoading(false);
      } else if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (err: any) {
      setError(err.message || t('checkout.failedGeneric'));
      setLoading(false);
    }
  };

  if (cryptoCheckout) {
    return (
      <Container maxWidth="2xl" className="py-12">
        <CryptoPaymentFlow orderId={cryptoCheckout.orderId} coins={cryptoCheckout.coins} />
      </Container>
    );
  }

  if (providerOptions) {
    return (
      <Container maxWidth="2xl" className="py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('checkout.choosePaymentProvider')}</h1>
          <p className="text-gray-600 mb-6">
            {t('checkout.choosePaymentProviderDesc')}
          </p>
          <div className="space-y-3">
            {providerOptions.map((provider) => (
              <a
                key={provider.id}
                href={provider.url}
                className="block w-full text-left rounded-lg border border-gray-300 p-4 hover:border-blue-600 hover:bg-blue-50 transition-colors font-medium text-gray-900"
              >
                {provider.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (cartLoading) {
    return (
      <Container className="py-12">
        <Loading />
      </Container>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Container className="py-12">
        <EmptyState
          title={t('checkout.empty')}
          message={t('checkout.emptyMessage')}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="4xl" className="py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.personalInformation')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('checkout.firstName')}
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label={t('checkout.lastName')}
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Input
                  label={t('checkout.email')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <Input
                  label={t('checkout.phone')}
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.shippingAddress')}</h2>
              <div className="space-y-4">
                <Input
                  label={t('checkout.streetAddress')}
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t('checkout.city')}
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label={t('checkout.state')}
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label={t('checkout.zipCode')}
                    name="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Select
                  label={t('checkout.country')}
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  options={localizedCountryOptions}
                  required
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.paymentMethod')}</h2>

              <div className="mb-4 max-w-xs">
                <Select
                  label={t('checkout.currency')}
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  options={CURRENCY_OPTIONS}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('checkout.localPaymentNote')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.paymentType === 'card'
                      ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="card"
                    checked={formData.paymentType === 'card'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{t('checkout.cardBank')}</span>
                    <span className="block text-sm text-gray-500">
                      {t('checkout.cardBankDesc')}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.paymentType === 'crypto'
                      ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value="crypto"
                    checked={formData.paymentType === 'crypto'}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{t('checkout.payCrypto')}</span>
                    <span className="block text-sm text-gray-500">
                      {t('checkout.payCryptoDesc')}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
            >
              {loading ? t('checkout.processing') : t('checkout.proceedToPayment')}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary showCheckoutButton={false} />
        </div>
      </div>
    </Container>
  );
}
