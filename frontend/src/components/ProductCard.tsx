'use client';

import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import ProductImage from './product/ProductImage';
import ProductInfo from './product/ProductInfo';
import QuantitySelector from './ui/QuantitySelector';
import Button from './ui/Button';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <ProductImage product={product} size="md" showLink={true} />
      <div className="p-4">
        <ProductInfo product={product} />
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-gray-700 text-sm font-medium">{t('product.quantity')}</span>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            size="sm"
          />
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAdding}
          fullWidth
        >
          {isAdding ? t('product.adding') : t('product.buyNow')}
        </Button>
      </div>
    </div>
  );
}
