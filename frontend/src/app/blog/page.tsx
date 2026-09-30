'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import PageHeader from '@/components/layout/PageHeader';
import Loading from '@/components/ui/Loading';

export default function BlogPage() {
  const { t, pick } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getArticles()
      .then(setArticles)
      .catch((error) => console.error('Error loading articles:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="py-12">
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader title={t('blog.title')} subtitle={t('blog.subtitle')} />

      {articles.length === 0 ? (
        <p className="text-center text-gray-600">{t('blog.noArticles')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              {article.featuredImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.featuredImage}
                  alt={pick(article.title, article.titleSv)}
                  className="w-full aspect-video object-cover"
                />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {pick(article.title, article.titleSv)}
                </h2>
                {(article.metaDescription || article.metaDescriptionSv) && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {pick(article.metaDescription, article.metaDescriptionSv)}
                  </p>
                )}
                <span className="text-blue-600 text-sm font-medium mt-auto">
                  {t('blog.readMore')} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
