'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthRedirect, useDataLoader } from '@/hooks';
import { adminApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Order } from '@/types';
import { PageHeader, PageLayout, Card } from '@/components/layout';
import { Button, Select } from '@/components/ui';
import { OrderStatusSelect, PaymentStatusSelect } from '@/components/features/orders';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuthRedirect();
  const { formatPrice } = useCurrency();
  const { data: order, loading, refetch } = useDataLoader<Order | null>({
    loadFn: () => adminApi.getOrder(orderId),
    enabled: !!user && !!orderId,
  });

  const handleStatusUpdate = async (status: Order['status']) => {
    if (!order) return;
    try {
      await adminApi.updateOrderStatus(order.id, status);
      refetch();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentStatusUpdate = async (paymentStatus: Order['paymentStatus']) => {
    if (!order) return;
    try {
      await adminApi.updatePaymentStatus(order.id, paymentStatus);
      refetch();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  if (!order) {
    return <PageLayout loading={loading} error="Order not found" />;
  }

  return (
    <PageLayout loading={loading}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          ← Back to Orders
        </Button>
        <PageHeader
          title={`Order ${order.orderNumber}`}
          description={`Created on ${new Date(order.createdAt).toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Order Items">
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount{order.affiliateCode ? ` (${order.affiliateCode})` : ''}
                  </span>
                  <span className="text-green-700 dark:text-green-400">
                    −{formatPrice(Number(order.discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(order.total)}
                </span>
              </div>
              {order.affiliateCode && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Affiliate: {order.affiliateCode}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Commission {formatPrice(Number(order.commission ?? 0))}
                    {order.paymentStatus === 'paid' ? '' : ' (counts once paid)'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Shipping Address">
            <div className="text-gray-700 dark:text-gray-300">
              <p className="font-medium">{order.customerName}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2">Phone: {order.customerPhone}</p>
              <p>Email: {order.customerEmail}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Order Status">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <OrderStatusSelect order={order} onStatusChange={handleStatusUpdate} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Status
                </label>
                <PaymentStatusSelect order={order} onStatusChange={handlePaymentStatusUpdate} />
              </div>
              {order.paymentTransactionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transaction ID
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.paymentTransactionId}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{order.paymentMethod}</p>
              </div>
              {order.shippedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shipped At
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.shippedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivered At
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.deliveredAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
