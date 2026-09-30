'use client';

import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from '@/components/ui/Button';

interface OrderSummaryProps {
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
  checkoutButtonText?: string;
}

export default function OrderSummary({
  onCheckout,
  showCheckoutButton = true,
  checkoutButtonText,
}: OrderSummaryProps) {
  const { cart, getTotalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orderSummary.title')}</h2>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-gray-600">
          <span>{t('orderSummary.subtotal')}</span>
          <span>{formatPrice(getTotalPrice())}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{t('orderSummary.shipping')}</span>
          <span>{t('orderSummary.shippingCalculated')}</span>
        </div>
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>{t('orderSummary.total')}</span>
            <span>{formatPrice(getTotalPrice())}</span>
          </div>
        </div>
      </div>
      {showCheckoutButton && onCheckout && (
        <>
          <Button onClick={onCheckout} fullWidth className="mb-4">
            {checkoutButtonText ?? t('orderSummary.proceedToCheckout')}
          </Button>
          <Button
            asLink
            href="/"
            variant="outline"
            fullWidth
            size="sm"
          >
            {t('cart.continueShopping')}
          </Button>
        </>
      )}
    </div>
  );
}
