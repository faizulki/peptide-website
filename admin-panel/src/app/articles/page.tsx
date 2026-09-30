'use client';

import { useState } from 'react';
import { useAuthRedirect, useDataLoader, useModal, useConfirm } from '@/hooks';
import { adminApi } from '@/lib/api';
import { Article } from '@/types';
import { PageHeader, PageLayout, Card } from '@/components/layout';
import { Button, Modal, Badge } from '@/components/ui';
import { ArticleForm } from '@/components/features/articles';

export default function ArticlesPage() {
  const { user } = useAuthRedirect();
  const { data: articles, loading, refetch } = useDataLoader<Article[]>({
    loadFn: adminApi.getArticles,
    enabled: !!user,
  });
  const { data: soroConfig } = useDataLoader<{ webhookUrl: string; secret: string }>({
    loadFn: adminApi.getSoroIntegrationConfig,
    enabled: !!user,
  });
  const modal = useModal<Article>();
  const { confirm } = useConfirm();
  const [copied, setCopied] = useState<'url' | 'secret' | null>(null);

  const handleCopy = async (value: string, which: 'url' | 'secret') => {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTogglePublished = async (article: Article) => {
    try {
      await adminApi.updateArticle(article.id, { isPublished: !article.isPublished });
      refetch();
    } catch (error) {
      console.error('Error updating article:', error);
      alert('Failed to update article');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Are you sure you want to delete this article?')) {
      try {
        await adminApi.deleteArticle(id);
        refetch();
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article');
      }
    }
  };

  const handleSave = async (data: Partial<Article>) => {
    try {
      if (modal.data) {
        await adminApi.updateArticle(modal.data.id, data);
      } else {
        await adminApi.createArticle(data as any);
      }
      modal.close();
      refetch();
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article');
      throw error;
    }
  };

  return (
    <PageLayout loading={loading}>
      <PageHeader
        title="Articles"
        description="Manage blog posts, including anything published automatically by Soro SEO"
        action={{
          label: '+ Add Article',
          onClick: () => modal.open(),
        }}
      />

      <Card title="Soro SEO Integration" className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Paste these into Soro&apos;s webhook configuration once you have an account connected.
          Soro will publish articles here automatically.
        </p>
        {soroConfig ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Webhook URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 break-all">
                  {soroConfig.webhookUrl}
                </code>
                <Button size="sm" variant="secondary" onClick={() => handleCopy(soroConfig.webhookUrl, 'url')}>
                  {copied === 'url' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Secret
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 break-all">
                  {soroConfig.secret}
                </code>
                <Button size="sm" variant="secondary" onClick={() => handleCopy(soroConfig.secret, 'secret')}>
                  {copied === 'secret' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Send this as an <code>x-webhook-secret</code> header, or as a <code>?secret=</code> query
                param if Soro doesn&apos;t support custom headers.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading integration details…</p>
        )}
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {articles?.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {article.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">/{article.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={article.source === 'soro' ? 'info' : 'default'}>
                      {article.source === 'soro' ? 'Soro SEO' : 'Manual'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={article.isPublished ? 'success' : 'default'}>
                      {article.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => modal.open(article)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleTogglePublished(article)}>
                      {article.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(article.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {articles?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No articles yet. Click &quot;Add Article&quot; to write one, or connect Soro SEO above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.data ? 'Edit Article' : 'Add Article'}
        size="xl"
      >
        <ArticleForm article={modal.data} onSubmit={handleSave} onCancel={modal.close} />
      </Modal>
    </PageLayout>
  );
}
