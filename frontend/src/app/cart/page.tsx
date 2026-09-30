'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import CartItem from '@/components/cart/CartItem';
import OrderSummary from '@/components/cart/OrderSummary';

export default function CartPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const { t } = useLanguage();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (loading) {
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
          title={t('cart.empty')}
          message={t('cart.emptyMessage')}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary onCheckout={handleCheckout} />
        </div>
      </div>
    </Container>
  );
}
