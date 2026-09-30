import { useState, useEffect } from 'react';
import { Affiliate, AffiliateInput } from '@/types';
import { Input, Checkbox, Button } from '@/components/ui';

interface AffiliateFormProps {
  affiliate?: Affiliate | null;
  onSubmit: (data: AffiliateInput) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_COMMISSION_PERCENT = 10;

export default function AffiliateForm({ affiliate, onSubmit, onCancel }: AffiliateFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    commissionPercent: DEFAULT_COMMISSION_PERCENT,
    discountPercent: 0,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    if (affiliate) {
      setFormData({
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email || '',
        commissionPercent: affiliate.commissionPercent,
        discountPercent: affiliate.discountPercent,
        isActive: affiliate.isActive,
        notes: affiliate.notes || '',
      });
    }
  }, [affiliate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ ...formData, code: formData.code.trim().toUpperCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save affiliate');
    } finally {
      setSaving(false);
    }
  };

  const percent = (value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="Code"
          required
          helperText="Used in their link and typed at checkout. Letters, numbers, - and _"
          pattern="[A-Za-z0-9_-]{2,32}"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
        />
      </div>

      <Input
        label="Email (optional)"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Commission (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          required
          helperText="Of the product total of each paid order, excluding shipping"
          value={formData.commissionPercent}
          onChange={(e) =>
            setFormData({ ...formData, commissionPercent: percent(e.target.value) })
          }
        />
        <Input
          label="Customer discount (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          helperText="0 = the code only tracks sales, no discount"
          value={formData.discountPercent}
          onChange={(e) =>
            setFormData({ ...formData, discountPercent: percent(e.target.value) })
          }
        />
      </div>

      <Input
        as="textarea"
        label="Notes (optional)"
        rows={3}
        helperText="Internal only — e.g. platform, payout wallet, agreement"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <Checkbox
        label="Active (link and code work)"
        checked={formData.isActive}
        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
