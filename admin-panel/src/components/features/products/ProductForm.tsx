import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { Input, Checkbox, Button } from '@/components/ui';
import { adminApi } from '@/lib/api';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const [lang, setLang] = useState<'en' | 'sv'>('en');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    nameSv: '',
    descriptionSv: '',
    shortDescriptionSv: '',
    price: 0,
    category: '',
    inStock: true,
    stockLevel: 0,
    isActive: true,
    isVisible: true,
    image: '',
    specifications: '',
    usage: '',
    storage: '',
    warnings: '',
    specificationsSv: '',
    usageSv: '',
    storageSv: '',
    warningsSv: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        nameSv: product.nameSv || '',
        descriptionSv: product.descriptionSv || '',
        shortDescriptionSv: product.shortDescriptionSv || '',
        // product.price is stored in EUR directly — no conversion, so it
        // can never drift just from opening and resaving this form.
        price: product.price,
        category: product.category,
        inStock: product.inStock,
        stockLevel: product.stockLevel || 0,
        isActive: product.isActive,
        isVisible: product.isVisible,
        image: product.image,
        specifications: product.extendedInfo?.specifications?.join('\n') || '',
        usage: product.extendedInfo?.usage || '',
        storage: product.extendedInfo?.storage || '',
        warnings: product.extendedInfo?.warnings?.join('\n') || '',
        specificationsSv: product.extendedInfoSv?.specifications?.join('\n') || '',
        usageSv: product.extendedInfoSv?.usage || '',
        storageSv: product.extendedInfoSv?.storage || '',
        warningsSv: product.extendedInfoSv?.warnings?.join('\n') || '',
      });
    }
  }, [product]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const { url } = await adminApi.uploadProductImage(file);
      setFormData((prev) => ({ ...prev, image: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      extendedInfo: {
        specifications: formData.specifications.split('\n').filter((s) => s.trim()),
        usage: formData.usage,
        storage: formData.storage,
        warnings: formData.warnings.split('\n').filter((w) => w.trim()),
      },
      extendedInfoSv: {
        specifications: formData.specificationsSv.split('\n').filter((s) => s.trim()),
        usage: formData.usageSv,
        storage: formData.storageSv,
        warnings: formData.warningsSv.split('\n').filter((w) => w.trim()),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Category"
          required
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Image
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
              {formData.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.image} alt="Product preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-gray-400 text-lg">📦</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageFileChange}
              disabled={uploading}
              className="block flex-1 text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-100"
            />
          </div>
          {uploading && <p className="text-sm text-gray-500 mt-1">Uploading…</p>}
          {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>

      <Input
        label="Image URL"
        type="text"
        value={formData.image}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
        placeholder="Or paste an image URL"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price (EUR)"
          type="number"
          step="0.01"
          required
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
        />
        <Input
          label="Stock Level"
          type="number"
          value={formData.stockLevel}
          onChange={(e) => setFormData({ ...formData, stockLevel: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Checkbox
          label="In Stock"
          checked={formData.inStock}
          onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
        />
        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Checkbox
          label="Visible"
          checked={formData.isVisible}
          onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
        />
      </div>

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
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Short Description"
              required
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            />
            <Input
              as="textarea"
              label="Description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              as="textarea"
              label="Specifications (one per line)"
              rows={3}
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
            />
            <Input
              as="textarea"
              label="Usage Instructions"
              rows={2}
              value={formData.usage}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
            />
            <Input
              as="textarea"
              label="Storage Instructions"
              rows={2}
              value={formData.storage}
              onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
            />
            <Input
              as="textarea"
              label="Warnings (one per line)"
              rows={2}
              value={formData.warnings}
              onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Namn (Name)"
              helperText="Lämna tomt för att falla tillbaka på engelska"
              value={formData.nameSv}
              onChange={(e) => setFormData({ ...formData, nameSv: e.target.value })}
            />
            <Input
              label="Kort beskrivning (Short Description)"
              value={formData.shortDescriptionSv}
              onChange={(e) => setFormData({ ...formData, shortDescriptionSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Beskrivning (Description)"
              rows={3}
              value={formData.descriptionSv}
              onChange={(e) => setFormData({ ...formData, descriptionSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Specifikationer (en per rad)"
              rows={3}
              value={formData.specificationsSv}
              onChange={(e) => setFormData({ ...formData, specificationsSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Användningsinstruktioner"
              rows={2}
              value={formData.usageSv}
              onChange={(e) => setFormData({ ...formData, usageSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Förvaringsinstruktioner"
              rows={2}
              value={formData.storageSv}
              onChange={(e) => setFormData({ ...formData, storageSv: e.target.value })}
            />
            <Input
              as="textarea"
              label="Varningar (en per rad)"
              rows={2}
              value={formData.warningsSv}
              onChange={(e) => setFormData({ ...formData, warningsSv: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
