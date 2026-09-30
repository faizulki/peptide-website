import {
  Product,
  Review,
  Order,
  AdminUser,
  ActivityLog,
  DashboardMetrics,
  AuthResponse,
  OrderItem,
} from '@/types';

// Mock data storage
let products: Product[] = [];
let reviews: Review[] = [];
let orders: Order[] = [];
let adminUsers: AdminUser[] = [];
let activityLogs: ActivityLog[] = [];
let currentAdmin: AdminUser | null = null;

// Initialize with default admin user
const defaultAdmin: AdminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  isActive: true,
  createdAt: new Date().toISOString(),
};
adminUsers.push(defaultAdmin);

// Initialize mock products
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'BPC-157',
    description: 'Body Protection Compound-157 is a synthetic peptide known for its healing properties.',
    shortDescription: 'Healing peptide for tissue repair and recovery',
    price: 89.99,
    image: '/api/placeholder/400/400',
    category: 'Recovery',
    inStock: true,
    stockLevel: 50,
    isActive: true,
    isVisible: true,
    extendedInfo: {
      specifications: ['Purity: 99%', 'Molecular Weight: 1419.61 g/mol', 'Sequence: 15 amino acids'],
      usage: 'Reconstitute with bacteriostatic water. Administer subcutaneously.',
      storage: 'Store in freezer at -20°C. Keep away from light.',
      warnings: ['For research purposes only', 'Not for human consumption'],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'TB-500',
    description: 'Thymosin Beta-4 fragment promotes cell migration and tissue repair.',
    shortDescription: 'Tissue repair and regeneration peptide',
    price: 129.99,
    image: '/api/placeholder/400/400',
    category: 'Recovery',
    inStock: true,
    stockLevel: 30,
    isActive: true,
    isVisible: true,
    extendedInfo: {
      specifications: ['Purity: 98%', 'Molecular Weight: 496.7 g/mol', 'Sequence: 4 amino acids'],
      usage: 'Reconstitute with sterile water. Subcutaneous injection recommended.',
      storage: 'Store frozen at -20°C. Protect from light.',
      warnings: ['Research use only', 'Handle with care'],
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'GHK-Cu',
    description: 'Copper peptide complex that supports skin health and collagen production.',
    shortDescription: 'Anti-aging and skin health peptide',
    price: 79.99,
    image: '/api/placeholder/400/400',
    category: 'Beauty',
    inStock: true,
    stockLevel: 75,
    isActive: true,
    isVisible: true,
    extendedInfo: {
      specifications: ['Purity: 99%', 'Molecular Weight: 340.8 g/mol', 'Copper complex'],
      usage: 'Topical application or reconstitute for injection.',
      storage: 'Store in refrigerator at 2-8°C.',
      warnings: ['For research purposes', 'Avoid direct sunlight'],
    },
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Ipamorelin',
    description: 'Growth hormone secretagogue that stimulates natural GH release.',
    shortDescription: 'Growth hormone releasing peptide',
    price: 99.99,
    image: '/api/placeholder/400/400',
    category: 'Performance',
    inStock: true,
    stockLevel: 40,
    isActive: true,
    isVisible: true,
    extendedInfo: {
      specifications: ['Purity: 98%', 'Molecular Weight: 711.9 g/mol', '5 amino acids'],
      usage: 'Reconstitute with bacteriostatic water. Subcutaneous injection.',
      storage: 'Store frozen at -20°C.',
      warnings: ['Research use only', 'Not for human consumption'],
    },
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];
products = [...initialProducts];

// Initialize mock reviews
const initialReviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userName: 'John D.',
    rating: 5,
    comment: 'Excellent product! Helped with my recovery significantly.',
    date: '2024-01-15',
    status: 'approved',
  },
  {
    id: '2',
    productId: '1',
    userName: 'Sarah M.',
    rating: 4,
    comment: 'Good quality, fast shipping. Would recommend.',
    date: '2024-01-20',
    status: 'approved',
  },
  {
    id: '3',
    productId: '2',
    userName: 'Mike T.',
    rating: 5,
    comment: 'Amazing results! Very satisfied with the purchase.',
    date: '2024-02-01',
    status: 'pending',
  },
  {
    id: '4',
    productId: '3',
    userName: 'Emma L.',
    rating: 4,
    comment: 'Great for skin health. Noticed improvements after a few weeks.',
    date: '2024-02-10',
    status: 'approved',
  },
];
reviews = [...initialReviews];

// Initialize mock orders
const generateMockOrders = (): Order[] => {
  const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatuses: Order['paymentStatus'][] = ['pending', 'paid', 'failed', 'refunded'];
  const mockOrders: Order[] = [];

  for (let i = 1; i <= 20; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const items: OrderItem[] = [
      {
        productId: String(Math.floor(Math.random() * 4) + 1),
        productName: products[Math.floor(Math.random() * products.length)].name,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: products[Math.floor(Math.random() * products.length)].price,
        subtotal: 0,
      },
    ];
    items[0].subtotal = items[0].price * items[0].quantity;
    const subtotal = items[0].subtotal;
    const shipping = 10;
    const total = subtotal + shipping;

    mockOrders.push({
      id: `order_${i}`,
      orderNumber: `ORD-${String(i).padStart(6, '0')}`,
      customerName: `Customer ${i}`,
      customerEmail: `customer${i}@example.com`,
      customerPhone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      shippingAddress: {
        address: `${Math.floor(Math.random() * 9999)} Main St`,
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      items,
      subtotal,
      shipping,
      discount: 0,
      total,
      status,
      paymentStatus,
      paymentMethod: 'B2BINPAY',
      paymentTransactionId: paymentStatus === 'paid' ? `txn_${Date.now()}_${i}` : undefined,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      shippedAt: status === 'shipped' || status === 'delivered' ? new Date().toISOString() : undefined,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
    });
  }

  return mockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
orders = generateMockOrders();

// Helper function to log activity
const logActivity = (
  userId: string,
  userName: string,
  action: string,
  entityType: ActivityLog['entityType'],
  entityId?: string,
  details?: string
) => {
  const log: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };
  activityLogs.unshift(log);
  // Keep only last 1000 logs
  if (activityLogs.length > 1000) {
    activityLogs = activityLogs.slice(0, 1000);
  }
};

// API Functions
export const adminApi = {
  // Authentication
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo: accept any password for admin@example.com
    if (email === 'admin@example.com') {
      currentAdmin = defaultAdmin;
      currentAdmin.lastLogin = new Date().toISOString();
      logActivity(defaultAdmin.id, defaultAdmin.name, 'Login', 'system');
      return {
        user: defaultAdmin,
        token: `admin_token_${Date.now()}`,
      };
    }

    const user = adminUsers.find((u) => u.email === email);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date().toISOString();
    currentAdmin = user;
    logActivity(user.id, user.name, 'Login', 'system');

    return {
      user,
      token: `admin_token_${Date.now()}`,
    };
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (currentAdmin) {
      logActivity(currentAdmin.id, currentAdmin.name, 'Logout', 'system');
    }
    currentAdmin = null;
  },

  getCurrentAdmin: async (): Promise<AdminUser | null> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return currentAdmin;
  },

  // Dashboard
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const totalSales = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const totalUsers = adminUsers.length;

    const recentOrders = orders.slice(0, 5);

    // Generate sales by month for last 6 months
    const salesByMonth = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const sales = orders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear() &&
            o.paymentStatus === 'paid'
          );
        })
        .reduce((sum, o) => sum + o.total, 0);
      return { month, sales };
    });

    const ordersByStatus = [
      { status: 'pending', count: orders.filter((o) => o.status === 'pending').length },
      { status: 'processing', count: orders.filter((o) => o.status === 'processing').length },
      { status: 'shipped', count: orders.filter((o) => o.status === 'shipped').length },
      { status: 'delivered', count: orders.filter((o) => o.status === 'delivered').length },
      { status: 'cancelled', count: orders.filter((o) => o.status === 'cancelled').length },
    ];

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      activeProducts,
      totalUsers,
      recentOrders,
      salesByMonth,
      ordersByStatus,
    };
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...products];
  },

  getProduct: async (id: string): Promise<Product | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return products.find((p) => p.id === id) || null;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newProduct: Product = {
      ...productData,
      id: `product_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        'Created product',
        'product',
        newProduct.id,
        `Product: ${newProduct.name}`
      );
    }

    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        'Updated product',
        'product',
        id,
        `Product: ${products[index].name}`
      );
    }

    return products[index];
  },

  deleteProduct: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const product = products.find((p) => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }

    products = products.filter((p) => p.id !== id);

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        'Deleted product',
        'product',
        id,
        `Product: ${product.name}`
      );
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...orders];
  },

  getOrder: async (id: string): Promise<Order | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return orders.find((o) => o.id === id) || null;
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'shipped') {
      order.shippedAt = new Date().toISOString();
    }
    if (status === 'delivered') {
      order.deliveredAt = new Date().toISOString();
    }

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        `Updated order status to ${status}`,
        'order',
        id,
        `Order: ${order.orderNumber}`
      );
    }

    return order;
  },

  updatePaymentStatus: async (id: string, paymentStatus: Order['paymentStatus']): Promise<Order> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        `Updated payment status to ${paymentStatus}`,
        'order',
        id,
        `Order: ${order.orderNumber}`
      );
    }

    return order;
  },

  // Reviews
  getReviews: async (): Promise<Review[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return reviews.map((review) => {
      const product = products.find((p) => p.id === review.productId);
      return { ...review, product };
    });
  },

  updateReviewStatus: async (id: string, status: Review['status']): Promise<Review> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const review = reviews.find((r) => r.id === id);
    if (!review) {
      throw new Error('Review not found');
    }

    review.status = status;

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        `Updated review status to ${status}`,
        'review',
        id
      );
    }

    return review;
  },

  deleteReview: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const review = reviews.find((r) => r.id === id);
    if (!review) {
      throw new Error('Review not found');
    }

    reviews = reviews.filter((r) => r.id !== id);

    if (currentAdmin) {
      logActivity(currentAdmin.id, currentAdmin.name, 'Deleted review', 'review', id);
    }
  },

  // Users
  getUsers: async (): Promise<AdminUser[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...adminUsers];
  },

  createUser: async (userData: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser> => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const newUser: AdminUser = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    adminUsers.push(newUser);

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        'Created user',
        'user',
        newUser.id,
        `User: ${newUser.email}`
      );
    }

    return newUser;
  },

  updateUser: async (id: string, updates: Partial<AdminUser>): Promise<AdminUser> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = adminUsers.find((u) => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, updates);

    if (currentAdmin) {
      logActivity(
        currentAdmin.id,
        currentAdmin.name,
        'Updated user',
        'user',
        id,
        `User: ${user.email}`
      );
    }

    return user;
  },

  deleteUser: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user = adminUsers.find((u) => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    adminUsers = adminUsers.filter((u) => u.id !== id);

    if (currentAdmin) {
      logActivity(currentAdmin.id, currentAdmin.name, 'Deleted user', 'user', id, `User: ${user.email}`);
    }
  },

  // Activity Logs
  getActivityLogs: async (limit: number = 100): Promise<ActivityLog[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return activityLogs.slice(0, limit);
  },
};

