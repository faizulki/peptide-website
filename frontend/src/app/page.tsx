'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';
import ResearchCredibility from '@/components/ResearchCredibility';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import PageHeader from '@/components/layout/PageHeader';
import Loading from '@/components/ui/Loading';

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await api.getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader
        title={t('home.title')}
        subtitle={t('home.subtitle')}
      />

      <Section title={t('home.featuredProducts')} className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      <div className="mb-16">
        <TrustBadges />
      </div>

      <ResearchCredibility />
    </Container>
  );
}
