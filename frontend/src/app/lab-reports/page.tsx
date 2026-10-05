'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LabReport } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Loading from '@/components/ui/Loading';
import LabReportGallery from '@/components/product/LabReportGallery';

interface ProductReports {
  product: NonNullable<LabReport['product']>;
  reports: LabReport[];
}

export default function LabReportsPage() {
  const { t, pick } = useLanguage();
  const [groups, setGroups] = useState<ProductReports[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLabReports()
      .then((reports) => {
        // The API returns reports sorted by product, newest first within
        // each — group them while keeping that order.
        const byProduct = new Map<string, ProductReports>();
        for (const report of reports) {
          if (!report.product) continue;
          const group = byProduct.get(report.productId) ?? { product: report.product, reports: [] };
          group.reports.push(report);
          byProduct.set(report.productId, group);
        }
        setGroups([...byProduct.values()]);
      })
      .catch((error) => console.error('Error loading lab reports:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('labReports.title')}</h1>
      <p className="text-gray-600 mb-10 max-w-3xl">{t('labReports.subtitle')}</p>

      {loading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <p className="text-gray-500">{t('labReports.empty')}</p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ product, reports }) => {
            const name = pick(product.name, product.nameSv);
            return (
              <section key={product.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {t('labReports.viewProduct')} →
                  </Link>
                </div>
                <LabReportGallery reports={reports} label={name} />
              </section>
            );
          })}
        </div>
      )}
    </Container>
  );
}
