'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { Article } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t, pick } = useLanguage();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api
      .getArticle(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-12">
        <Loading />
      </Container>
    );
  }

  if (!article) {
    return (
      <Container className="py-12">
        <EmptyState
          title={t('blog.notFound')}
          message={t('blog.notFoundMessage')}
          actionLabel={t('blog.backToBlog')}
          actionHref="/blog"
        />
      </Container>
    );
  }

  const content = pick(article.content, article.contentSv);
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <Container maxWidth="4xl" className="py-12">
      <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
        {article.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.featuredImage}
            alt={pick(article.title, article.titleSv)}
            className="w-full aspect-video object-cover rounded-lg mb-8"
          />
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {pick(article.title, article.titleSv)}
        </h1>
        <div
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </Container>
  );
}
