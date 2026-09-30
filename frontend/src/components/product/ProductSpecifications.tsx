'use client';

import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductSpecificationsProps {
  product: Product;
}

export default function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const { language, t } = useLanguage();
  const info =
    (language === 'sv' && product.extendedInfoSv && (
      product.extendedInfoSv.specifications.length > 0 ||
      product.extendedInfoSv.usage ||
      product.extendedInfoSv.storage ||
      product.extendedInfoSv.warnings.length > 0
    )
      ? product.extendedInfoSv
      : product.extendedInfo);

  if (!info) return null;

  return (
    <div className="space-y-4">
      {info.specifications.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{t('product.specifications')}</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {info.specifications.map((spec, idx) => (
              <li key={idx}>{spec}</li>
            ))}
          </ul>
        </div>
      )}

      {info.usage && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{t('product.usage')}</h3>
          <p className="text-gray-700">{info.usage}</p>
        </div>
      )}

      {info.storage && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{t('product.storage')}</h3>
          <p className="text-gray-700">{info.storage}</p>
        </div>
      )}

      {info.warnings && info.warnings.length > 0 && (
        <div>
          <h3 className="font-semibold text-red-600 mb-2">{t('product.warnings')}</h3>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            {info.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
