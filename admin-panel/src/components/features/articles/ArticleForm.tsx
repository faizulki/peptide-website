import { useState, useEffect, useRef } from 'react';
import { Article } from '@/types';
import { adminApi } from '@/lib/api';
import { Input, Checkbox, Button } from '@/components/ui';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface ArticleFormProps {
  article?: Article | null;
  onSubmit: (data: Partial<Article>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ArticleForm({ article, onSubmit, onCancel, loading }: ArticleFormProps) {
  const [lang, setLang] = useState<'en' | 'sv'>('en');
  const [error, setError] = useState('');
  const [featuredUploading, setFeaturedUploading] = useState(false);
  const featuredInputRef = useRef<HTMLInputElement>(null);

  // Article images go through the same admin-only upload as product images.
  const uploadImage = async (file: File) => (await adminApi.uploadProductImage(file)).url;

  const handleFeaturedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setFeaturedUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, featuredImage: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setFeaturedUploading(false);
    }
  };
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
    // An article can be written in English, Swedish or both — the website
    // shows whichever language exists — but it needs a title and content.
    if (!formData.title.trim() && !formData.titleSv.trim()) {
      setError('Add a title in English or Swedish.');
      return;
    }
    if (!formData.content.trim() && !formData.contentSv.trim()) {
      setError('Add the article text in English or Swedish.');
      return;
    }
    setError('');
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Input
        label="Slug (web address)"
        helperText="The end of the article's link, e.g. eupeptides.org/blog/my-article. Leave blank to create it from the title."
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Main image
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-40 aspect-video rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
            {formData.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={formData.featuredImage} alt="Main image preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">No image</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={featuredInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleFeaturedFile}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={featuredUploading}
                onClick={() => featuredInputRef.current?.click()}
              >
                {featuredUploading ? 'Uploading…' : formData.featuredImage ? 'Replace image' : 'Upload image'}
              </Button>
              {formData.featuredImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, featuredImage: '' }))}
                >
                  Remove
                </Button>
              )}
            </div>
            <Input
              aria-label="Main image URL"
              placeholder="Or paste an image URL"
              value={formData.featuredImage}
              onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Shown at the top of the article and on the blog overview. JPEG, PNG, WEBP or GIF, up to 10 MB.
            </p>
          </div>
        </div>
      </div>

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
              helperText="Leave empty if the article is only in Swedish"
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
            <RichTextEditor
              label="Content"
              helperText="Use the 🖼 Image button, or drag a picture into the text, to add images."
              onUploadImage={uploadImage}
              value={formData.content}
              onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Titel (Title)"
              helperText="Lämna tomt om artikeln bara finns på engelska"
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
            <RichTextEditor
              label="Innehåll (Content)"
              helperText="Lägg till bilder med 🖼 Image-knappen, eller dra in en bild i texten."
              onUploadImage={uploadImage}
              value={formData.contentSv}
              onChange={(html) => setFormData((prev) => ({ ...prev, contentSv: html }))}
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
