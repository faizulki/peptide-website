'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="2xl" className="py-12">
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('checkoutSuccess.title')}</h1>
        <p className="text-gray-600 mb-8">
          {t('checkoutSuccess.message')}
        </p>
        <Button asLink href="/">
          {t('cart.continueShopping')}
        </Button>
      </div>
    </Container>
  );
}
