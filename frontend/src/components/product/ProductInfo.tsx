'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductInfoProps {
  product: Product;
  showDescription?: boolean;
  showPrice?: boolean;
  className?: string;
}

export default function ProductInfo({
  product,
  showDescription = true,
  showPrice = true,
  className = '',
}: ProductInfoProps) {
  const { formatPrice } = useCurrency();
  const { pick } = useLanguage();

  return (
    <div className={className}>
      <Link href={`/products/${product.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
          {pick(product.name, product.nameSv)}
        </h3>
      </Link>
      {showDescription && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {pick(product.shortDescription, product.shortDescriptionSv)}
        </p>
      )}
      {showPrice && (
        <p className="text-2xl font-bold text-blue-600">
          {formatPrice(product.price)}
        </p>
      )}
    </div>
  );
}
