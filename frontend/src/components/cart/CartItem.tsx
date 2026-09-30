'use client';

import Link from 'next/link';
import { CartItem as CartItemType } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductImage from '@/components/product/ProductImage';
import ProductInfo from '@/components/product/ProductInfo';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  if (!item.product) return null;

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.productId, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.productId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4">
        <ProductImage product={item.product} size="sm" showLink={true} />
        
        <div className="flex-1">
          <ProductInfo product={item.product} showDescription={false} showPrice={true} />
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            min={1}
            size="sm"
          />
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(item.product.price * item.quantity)}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemove}
            className="!px-2 !py-1 text-xs"
          >
            {t('cart.remove')}
          </Button>
        </div>
      </div>
    </div>
  );
}

