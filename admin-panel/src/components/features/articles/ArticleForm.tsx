import { useState, useEffect } from 'react';
import { Article } from '@/types';
import { Input, Checkbox, Button } from '@/components/ui';

interface ArticleFormProps {
  article?: Article | null;
  onSubmit: (data: Partial<Article>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ArticleForm({ article, onSubmit, onCancel, loading }: ArticleFormProps) {
  const [lang, setLang] = useState<'en' | 'sv'>('en');
  const [formData, setFormData] = useState({
    title: '',
    titleSv: '',
    slug: '',
    content: '',
    contentSv: '',
    metaDescription: '',
    metaDescriptionSv: '',
    featuredImage: '',
    isPublished: true,
  });

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        titleSv: article.titleSv || '',
        slug: article.slug,
        content: article.content,
        contentSv: article.contentSv || '',
        metaDescription: article.metaDescription || '',
        metaDescriptionSv: article.metaDescriptionSv || '',
        featuredImage: article.featuredImage || '',
        isPublished: article.isPublished,
      });
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Slug"
        helperText="Leave blank to auto-generate from the English title"
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />

      <Input
        label="Featured Image URL"
        value={formData.featuredImage}
        onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
      />

      <Checkbox
        label="Published"
        checked={formData.isPublished}
        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
      />

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              lang === 'en'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('sv')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              lang === 'sv'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Svenska
          </button>
        </div>

        {lang === 'en' ? (
          <div className="space-y-4">
            <Input
              label="Title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              as="textarea"
              label="Meta Description"
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            />
            <Input
              as="textarea"
              label="Content (HTML)"
              required
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Titel (Title)"
              helperText="Lämna tomt för att falla tillbaka på engelska"
              value={formData.titleSv}
              onChange={(e) => setFormData({ ...formData, titleSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Metabeskrivning (Meta Description)"
              rows={2}
              value={formData.metaDescriptionSv}
              onChange={(e) => setFormData({ ...formData, metaDescriptionSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Innehåll (Content, HTML)"
              rows={12}
              value={formData.contentSv}
              onChange={(e) => setFormData({ ...formData, contentSv: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
