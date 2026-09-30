import {
  Product,
  Review,
  Order,
  AdminUser,
  ActivityLog,
  DashboardMetrics,
  AuthResponse,
  Faq,
  Article,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

interface BackendAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function toAdminUser(u: BackendAuthUser): AdminUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as 'admin' | 'manager',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

// Product create/update forms nest specs under extendedInfo; the backend
// DTOs take them flat.
function toProductPayload(data: Partial<Product>) {
  const { extendedInfo, extendedInfoSv, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (extendedInfo) {
    payload.specifications = extendedInfo.specifications;
    payload.usage = extendedInfo.usage;
    payload.storage = extendedInfo.storage;
    payload.warnings = extendedInfo.warnings;
  }
  if (extendedInfoSv) {
    payload.specificationsSv = extendedInfoSv.specifications;
    payload.usageSv = extendedInfoSv.usage;
    payload.storageSv = extendedInfoSv.storage;
    payload.warningsSv = extendedInfoSv.warnings;
  }
  return payload;
}

export const adminApi = {
  // Authentication
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await request<{ user: BackendAuthUser; token: string }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { user: toAdminUser(data.user), token: data.token };
  },

  logout: async (): Promise<void> => {
    // JWTs are stateless — there's no server-side session to invalidate.
    // The caller clears the stored token, which is what actually logs out.
  },

  getCurrentAdmin: async (): Promise<AdminUser | null> => {
    if (!getToken()) return null;
    try {
      const data = await request<BackendAuthUser>('/admin/auth/me');
      return toAdminUser(data);
    } catch {
      return null;
    }
  },

  // Dashboard
  getDashboardMetrics: (): Promise<DashboardMetrics> => request('/admin/dashboard'),

  // Products
  getProducts: (): Promise<Product[]> => request('/products?includeInactive=true'),

  getProduct: (id: string): Promise<Product> => request(`/products/${id}`),

  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(toProductPayload(productData)),
    }),

  updateProduct: (id: string, updates: Partial<Product>): Promise<Product> =>
    request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toProductPayload(updates)),
    }),

  deleteProduct: (id: string): Promise<void> => request(`/products/${id}`, { method: 'DELETE' }),

  uploadProductImage: async (file: File): Promise<{ url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    // No Content-Type here — the browser sets multipart/form-data with the
    // correct boundary itself; setting it manually breaks the upload.
    const res = await fetch(`${API_URL}/uploads/product-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message || `Upload failed with status ${res.status}`;
      throw new Error(message);
    }

    return res.json();
  },

  // Orders
  getOrders: (): Promise<Order[]> => request('/orders'),

  getOrder: (id: string): Promise<Order> => request(`/orders/${id}`),

  updateOrderStatus: (id: string, status: Order['status']): Promise<Order> =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id: string, paymentStatus: Order['paymentStatus']): Promise<Order> =>
    request(`/orders/${id}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    }),

  // Reviews
  getReviews: (): Promise<Review[]> => request('/reviews/admin'),

  updateReviewStatus: (id: string, status: Review['status']): Promise<Review> =>
    request(`/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteReview: (id: string): Promise<void> => request(`/reviews/${id}`, { method: 'DELETE' }),

  // Users (staff accounts — admin/manager only)
  getUsers: (): Promise<AdminUser[]> => request('/admin/users'),

  createUser: (userData: Partial<AdminUser> & { password: string }): Promise<AdminUser> =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (id: string, updates: Partial<AdminUser> & { password?: string }): Promise<AdminUser> =>
    request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteUser: (id: string): Promise<void> => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Activity logs
  getActivityLogs: (limit: number = 100): Promise<ActivityLog[]> =>
    request(`/admin/logs?limit=${limit}`),

  // FAQs
  getFaqs: (): Promise<Faq[]> => request('/faqs?includeInactive=true'),

  createFaq: (faqData: Omit<Faq, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faq> =>
    request('/faqs', {
      method: 'POST',
      body: JSON.stringify(faqData),
    }),

  updateFaq: (id: string, updates: Partial<Faq>): Promise<Faq> =>
    request(`/faqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteFaq: (id: string): Promise<void> => request(`/faqs/${id}`, { method: 'DELETE' }),

  // Articles / blog
  getArticles: (): Promise<Article[]> => request('/articles/admin/all'),

  createArticle: (data: Omit<Article, 'id' | 'slug' | 'source' | 'createdAt' | 'updatedAt'> & { slug?: string }): Promise<Article> =>
    request('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArticle: (id: string, updates: Partial<Article>): Promise<Article> =>
    request(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteArticle: (id: string): Promise<void> => request(`/articles/${id}`, { method: 'DELETE' }),

  // Soro SEO webhook config — shown to the client so they can paste it into
  // their Soro dashboard once they have an account.
  getSoroIntegrationConfig: (): Promise<{ webhookUrl: string; secret: string }> =>
    request('/admin/integrations/soro'),
};
