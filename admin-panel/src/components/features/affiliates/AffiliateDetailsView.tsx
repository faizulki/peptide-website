import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useConfirm } from '@/hooks';
import { AffiliateDetails } from '@/types';
import { Input, Button, Badge, Loading } from '@/components/ui';

interface AffiliateDetailsViewProps {
  affiliateId: string;
  // Called after a payout is added or removed, so the list's totals refresh.
  onChange: () => void;
}

const paymentBadge: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'default',
};

export default function AffiliateDetailsView({ affiliateId, onChange }: AffiliateDetailsViewProps) {
  const { formatPrice } = useCurrency();
  const { confirm } = useConfirm();
  const [details, setDetails] = useState<AffiliateDetails | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await adminApi.getAffiliate(affiliateId);
    setDetails(data);
    setAmount(data.stats.owed > 0 ? data.stats.owed.toFixed(2) : '');
  }, [affiliateId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load affiliate'));
  }, [load]);

  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.createAffiliatePayout(affiliateId, {
        amount: Math.round(parseFloat(amount) * 100) / 100,
        note: note.trim() || undefined,
      });
      setNote('');
      await load();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payout');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayout = async (payoutId: string) => {
    if (!(await confirm('Delete this payout record?'))) return;
    try {
      await adminApi.deleteAffiliatePayout(affiliateId, payoutId);
      await load();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payout');
    }
  };

  if (!details) {
    return error ? <p className="text-sm text-red-600">{error}</p> : <Loading />;
  }

  const { stats } = details;
  const summary = [
    { label: 'Clicks', value: details.clicks.toString() },
    { label: 'Paid orders', value: stats.paidOrders.toString() },
    { label: 'Sales', value: formatPrice(stats.sales) },
    { label: 'Commission earned', value: formatPrice(stats.commissionEarned) },
    { label: 'Paid out', value: formatPrice(stats.paidOut) },
    { label: 'Owed', value: formatPrice(stats.owed) },
  ];

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Orders</h3>
        {details.orders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No orders through this affiliate yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {details.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={paymentBadge[order.paymentStatus] || 'default'}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">
                      {formatPrice(order.total)}
                    </td>
                    <td
                      className={`py-2 text-right ${
                        order.paymentStatus === 'paid'
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 line-through'
                      }`}
                      title={order.paymentStatus === 'paid' ? undefined : 'Only paid orders earn commission'}
                    >
                      {formatPrice(order.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payouts</h3>
        {details.payouts.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 mb-4">
            {details.payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {new Date(payout.createdAt).toLocaleDateString()}
                  {payout.note ? ` — ${payout.note}` : ''}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(payout.amount)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePayout(payout.id)}>
                    Delete
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddPayout} className="grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] gap-3 items-end">
          <Input
            label="Amount (€)"
            type="number"
            min={0.01}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Note (optional)"
            placeholder="e.g. USDC transfer, tx hash"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="submit" disabled={saving || !amount}>
            {saving ? 'Saving...' : 'Record payout'}
          </Button>
        </form>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Pay the affiliate outside the site, then record it here to keep their balance.
        </p>
      </section>
    </div>
  );
}
