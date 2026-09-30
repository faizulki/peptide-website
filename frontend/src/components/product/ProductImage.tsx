'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductImageProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLink?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'w-24 h-24',
  md: 'aspect-square',
  lg: 'aspect-square',
  xl: 'aspect-square',
};

export default function ProductImage({
  product,
  size = 'md',
  showLink = true,
  className = '',
}: ProductImageProps) {
  const { pick, t } = useLanguage();
  const imageContent = (
    <div className={`${sizeStyles[size]} bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden ${className}`}>
      {product.image && !product.image.includes('/api/placeholder') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt={pick(product.name, product.nameSv)}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg className={`${size === 'sm' ? 'w-12 h-12' : 'w-24 h-24'} text-gray-400`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {!product.inStock && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
          {t('product.outOfStock')}
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link href={`/products/${product.id}`}>
        {imageContent}
      </Link>
    );
  }

  return imageContent;
}

