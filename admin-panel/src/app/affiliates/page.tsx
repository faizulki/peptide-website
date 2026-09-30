'use client';

import { useState } from 'react';
import { useAuthRedirect, useDataLoader, useModal, useConfirm } from '@/hooks';
import { adminApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Affiliate, AffiliateInput } from '@/types';
import { PageHeader, PageLayout, Card } from '@/components/layout';
import { Button, Modal, Badge } from '@/components/ui';
import { AffiliateForm, AffiliateDetailsView } from '@/components/features/affiliates';

const th =
  'px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider';
const thRight = `${th} text-right`;
const td = 'px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white';
const tdRight = `${td} text-right`;

export default function AffiliatesPage() {
  const { user } = useAuthRedirect();
  const { data: affiliates, loading, refetch } = useDataLoader<Affiliate[]>({
    loadFn: adminApi.getAffiliates,
    enabled: !!user,
  });
  const { formatPrice } = useCurrency();
  const formModal = useModal<Affiliate>();
  const detailsModal = useModal<Affiliate>();
  const { confirm } = useConfirm();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (affiliate: Affiliate) => {
    try {
      await navigator.clipboard.writeText(affiliate.link);
      setCopiedId(affiliate.id);
      setTimeout(() => setCopiedId((id) => (id === affiliate.id ? null : id)), 2000);
    } catch {
      window.prompt('Copy this link:', affiliate.link);
    }
  };

  const handleToggleActive = async (affiliate: Affiliate) => {
    try {
      await adminApi.updateAffiliate(affiliate.id, { isActive: !affiliate.isActive });
      refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update affiliate');
    }
  };

  const handleDelete = async (affiliate: Affiliate) => {
    if (!(await confirm(`Delete affiliate ${affiliate.name} (${affiliate.code})?`))) return;
    try {
      await adminApi.deleteAffiliate(affiliate.id);
      refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete affiliate');
    }
  };

  // Errors propagate to AffiliateForm, which shows them inline (e.g. a
  // code that's already taken).
  const handleSave = async (data: AffiliateInput) => {
    if (formModal.data) {
      await adminApi.updateAffiliate(formModal.data.id, data);
    } else {
      await adminApi.createAffiliate(data);
    }
    formModal.close();
    refetch();
  };

  const list = affiliates || [];
  const totals = list.reduce(
    (acc, a) => ({
      sales: acc.sales + a.stats.sales,
      earned: acc.earned + a.stats.commissionEarned,
      owed: acc.owed + a.stats.owed,
    }),
    { sales: 0, earned: 0, owed: 0 },
  );

  return (
    <PageLayout loading={loading}>
      <PageHeader
        title="Affiliates"
        description="Influencer links and codes, the sales they bring in, and commission owed"
        action={{
          label: '+ Add Affiliate',
          onClick: () => formModal.open(),
        }}
      />

      {list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Affiliate sales (paid)', value: totals.sales },
            { label: 'Commission earned', value: totals.earned },
            { label: 'Commission owed', value: totals.owed },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatPrice(Math.round(item.value * 100) / 100)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className={th}>Affiliate</th>
                <th className={th}>Link</th>
                <th className={thRight} title="Commission / customer discount">Rates</th>
                <th className={thRight}>Clicks</th>
                <th className={thRight}>Paid orders</th>
                <th className={thRight}>Sales</th>
                <th className={thRight}>Owed</th>
                <th className={th}>Status</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {list.map((affiliate) => (
                <tr key={affiliate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {affiliate.name}
                    </div>
                    <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {affiliate.code}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleCopyLink(affiliate)}>
                      {copiedId === affiliate.id ? 'Copied!' : 'Copy link'}
                    </Button>
                  </td>
                  <td className={tdRight}>
                    {affiliate.commissionPercent}%
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {affiliate.discountPercent > 0
                        ? `${affiliate.discountPercent}% off`
                        : 'no discount'}
                    </div>
                  </td>
                  <td className={tdRight}>{affiliate.clicks}</td>
                  <td className={tdRight}>
                    {affiliate.stats.paidOrders}
                    {affiliate.stats.pendingOrders > 0 && (
                      <span className="text-gray-400"> (+{affiliate.stats.pendingOrders} unpaid)</span>
                    )}
                  </td>
                  <td className={tdRight}>{formatPrice(affiliate.stats.sales)}</td>
                  <td className={`${tdRight} font-semibold`}>{formatPrice(affiliate.stats.owed)}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge variant={affiliate.isActive ? 'success' : 'default'}>
                      {affiliate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => detailsModal.open(affiliate)}>
                      Details
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => formModal.open(affiliate)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(affiliate)}>
                      {affiliate.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {affiliate.stats.paidOrders + affiliate.stats.pendingOrders === 0 && (
                      <Button variant="danger" size="sm" onClick={() => handleDelete(affiliate)}>
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No affiliates yet. Click &quot;Add Affiliate&quot; to create one and get their link.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.data ? 'Edit Affiliate' : 'Add Affiliate'}
        size="lg"
      >
        <AffiliateForm
          affiliate={formModal.data}
          onSubmit={handleSave}
          onCancel={formModal.close}
        />
      </Modal>

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.close}
        title={detailsModal.data ? `${detailsModal.data.name} (${detailsModal.data.code})` : ''}
        size="xl"
      >
        {detailsModal.data && (
          <AffiliateDetailsView affiliateId={detailsModal.data.id} onChange={refetch} />
        )}
      </Modal>
    </PageLayout>
  );
}
