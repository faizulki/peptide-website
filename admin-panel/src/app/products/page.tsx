'use client';

import { useAuthRedirect, useDataLoader, useModal, useConfirm } from '@/hooks';
import { adminApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/types';
import { PageHeader, PageLayout, FilterBar, Card } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { StatusBadge } from '@/components/table';
import { ProductForm, LabReportsManager } from '@/components/features/products';
import Link from 'next/link';

export default function ProductsPage() {
  const { user } = useAuthRedirect();
  const { formatPrice } = useCurrency();
  const { data: products, loading, refetch } = useDataLoader<Product[]>({
    loadFn: adminApi.getProducts,
    enabled: !!user,
  });
  const modal = useModal<Product>();
  const labReportsModal = useModal<Product>();
  const { confirm } = useConfirm();

  const handleToggleActive = async (product: Product) => {
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.isActive });
      refetch();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleToggleVisible = async (product: Product) => {
    try {
      await adminApi.updateProduct(product.id, { isVisible: !product.isVisible });
      refetch();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApi.deleteProduct(id);
        refetch();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleSave = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (modal.data) {
        await adminApi.updateProduct(modal.data.id, data);
      } else {
        await adminApi.createProduct(data);
      }
      modal.close();
      refetch();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
      throw error;
    }
  };

  return (
    <PageLayout loading={loading}>
      <PageHeader
        title="Products"
        description="Manage your peptide products"
        action={{
          label: '+ Add Product',
          onClick: () => modal.open(),
        }}
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
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
              {products?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                          {product.image && !product.image.includes('/api/placeholder') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.shortDescription}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.stockLevel ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <StatusBadge
                        status={product.isActive ? 'active' : 'inactive'}
                        type="product"
                      />
                      <StatusBadge
                        status={product.isVisible ? 'visible' : 'hidden'}
                        type="product"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => modal.open(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => labReportsModal.open(product)}
                    >
                      Lab reports
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisible(product)}
                    >
                      {product.isVisible ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.data ? 'Edit Product' : 'Create Product'}
        size="xl"
      >
        <ProductForm
          product={modal.data}
          onSubmit={handleSave}
          onCancel={modal.close}
        />
      </Modal>

      <Modal
        isOpen={labReportsModal.isOpen}
        onClose={labReportsModal.close}
        title={labReportsModal.data ? `Lab reports — ${labReportsModal.data.name}` : 'Lab reports'}
        size="xl"
      >
        {labReportsModal.data && <LabReportsManager product={labReportsModal.data} />}
      </Modal>
    </PageLayout>
  );
}
