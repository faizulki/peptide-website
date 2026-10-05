'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product, Review, LabReport } from '@/types';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReviewCard from '@/components/ReviewCard';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import ProductImage from '@/components/product/ProductImage';
import ProductSpecifications from '@/components/product/ProductSpecifications';
import LabReportGallery from '@/components/product/LabReportGallery';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t, pick } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, reviewsData] = await Promise.all([
          api.getProduct(productId),
          api.getProductReviews(productId)
        ]);
        setProduct(productData);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
      // Loaded separately so a failure here never hides the product itself.
      api
        .getLabReports(productId)
        .then(setLabReports)
        .catch((error) => console.error('Error loading lab reports:', error));
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-12">
        <Loading />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-12">
        <EmptyState
          title={t('product.notFound')}
          message={t('product.notFoundMessage')}
          actionLabel={t('product.returnHome')}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <ProductImage product={product} size="xl" showLink={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{pick(product.name, product.nameSv)}</h1>
          <p className="text-2xl font-semibold text-blue-600 mb-6">
            {formatPrice(product.price)}
          </p>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{pick(product.description, product.descriptionSv)}</p>
          </div>

          {product.extendedInfo && (
            <div className="mb-6">
              <ProductSpecifications product={product} />
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-gray-700 font-medium">{t('product.quantity')}</span>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                size="lg"
              />
            </div>
            
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              fullWidth
              size="lg"
            >
              {isAdding ? t('product.addingToCart') : product.inStock ? t('product.addToCart') : t('product.outOfStock')}
            </Button>
          </div>
        </div>
      </div>

      {labReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('labReports.productSection')}</h2>
          <p className="text-gray-600 mb-6">{t('labReports.productIntro')}</p>
          <LabReportGallery reports={labReports} label={pick(product.name, product.nameSv)} />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <Section title={t('product.customerReviews')}>
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </Section>
        </div>
      )}
    </Container>
  );
}
