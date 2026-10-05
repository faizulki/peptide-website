import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/api';
import { useConfirm } from '@/hooks';
import { LabReport, Product } from '@/types';
import { Input, Button, Loading } from '@/components/ui';

interface LabReportsManagerProps {
  product: Product;
}

// Lab report images for one product. Each upload becomes a separate report
// (typically one per batch); the storefront shows them newest test first on
// the product page and on the Lab Reports page.
export default function LabReportsManager({ product }: LabReportsManagerProps) {
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<LabReport[] | null>(null);
  const [image, setImage] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [testDate, setTestDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setReports(await adminApi.getProductLabReports(product.id));
  }, [product.id]);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load lab reports'),
    );
  }, [load]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await adminApi.uploadProductImage(file);
      setImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setError('');
    setSaving(true);
    try {
      await adminApi.createLabReport({
        productId: product.id,
        image,
        batchNumber: batchNumber.trim() || undefined,
        testDate: testDate || undefined,
      });
      setImage('');
      setBatchNumber('');
      setTestDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lab report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (report: LabReport) => {
    if (!(await confirm('Delete this lab report? It will disappear from the website.'))) return;
    try {
      await adminApi.deleteLabReport(report.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lab report');
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!product.isVisible || !product.isActive ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          This product is hidden or inactive, so its lab reports aren&apos;t shown on the website.
        </p>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current reports</h3>
        {reports === null ? (
          <Loading />
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No lab reports for this product yet.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reports.map((report) => (
              <li
                key={report.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <a href={report.image} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.image}
                    alt={`Lab report ${report.batchNumber ?? ''}`}
                    className="aspect-[3/4] w-full object-contain bg-gray-50 dark:bg-gray-700"
                  />
                </a>
                <div className="p-2 text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                  <p>Batch: {report.batchNumber || '—'}</p>
                  <p>Tested: {report.testDate || '—'}</p>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(report)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleAdd} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add a lab report</h3>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-16 w-12 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Report preview" className="h-full w-full object-contain" />
            ) : (
              <span className="text-gray-400 text-lg">🧪</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="block flex-1 text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-100"
          />
        </div>
        {uploading && <p className="text-sm text-gray-500">Uploading…</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, WEBP or GIF, up to 10 MB.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Batch number (optional)"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
          />
          <Input
            label="Test date (optional)"
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!image || uploading || saving}>
            {saving ? 'Saving...' : 'Add report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
