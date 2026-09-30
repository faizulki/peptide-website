import {
  Product,
  Review,
  Cart,
  CheckoutData,
  CryptoCoinOption,
  Faq,
  Article,
  AffiliateCodeInfo,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const generateGuestId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

export const api = {
  // Products
  getProducts: (): Promise<Product[]> => request('/products/visible'),

  getProduct: (id: string): Promise<Product> => request(`/products/${id}`),

  getProductReviews: (productId: string): Promise<Review[]> =>
    request(`/reviews?productId=${encodeURIComponent(productId)}`),

  // Cart (guest-scoped; the peptide storefront doesn't require an account to buy)
  getCart: (guestId: string): Promise<Cart> =>
    request(`/cart?guestId=${encodeURIComponent(guestId)}`),

  addToCart: (productId: string, quantity: number, guestId: string): Promise<Cart> =>
    request(`/cart/add?guestId=${encodeURIComponent(guestId)}`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateCartItem: (productId: string, quantity: number, guestId: string): Promise<Cart> =>
    request(`/cart/items/${encodeURIComponent(productId)}?guestId=${encodeURIComponent(guestId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (productId: string, guestId: string): Promise<Cart> =>
    request(`/cart/items/${encodeURIComponent(productId)}?guestId=${encodeURIComponent(guestId)}`, {
      method: 'DELETE',
    }),

  clearCart: (guestId: string): Promise<Cart> =>
    request(`/cart/clear?guestId=${encodeURIComponent(guestId)}`, { method: 'DELETE' }),

  // Checkout
  checkout: (
    checkoutData: CheckoutData,
    guestId: string,
  ): Promise<{
    order: { id: string; orderNumber: string };
    paymentUrl?: string;
    providers?: { id: string; name: string; url: string }[];
    cryptoCoins?: CryptoCoinOption[];
  }> =>
    request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        firstName: checkoutData.firstName,
        lastName: checkoutData.lastName,
        email: checkoutData.email,
        phone: checkoutData.phone,
        shippingAddress: {
          address: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: checkoutData.country,
        },
        paymentType: checkoutData.paymentType,
        currency: checkoutData.currency,
        affiliateCode: checkoutData.affiliateCode || undefined,
        guestId,
      }),
    }),

  selectCryptoCoin: (
    orderId: string,
    coinPath: string,
  ): Promise<{ address: string; amountCoin: string; coinPath: string }> =>
    request(`/orders/${encodeURIComponent(orderId)}/crypto-payment`, {
      method: 'POST',
      body: JSON.stringify({ coinPath }),
    }),

  // Reuses PayGate's own webhook route — it independently re-verifies
  // against PayGate before reporting paid, so it's safe to poll directly.
  checkPaymentStatus: (orderId: string): Promise<{ received: boolean; processed?: boolean }> =>
    request(`/webhooks/paygate?orderId=${encodeURIComponent(orderId)}`),

  // Affiliates
  lookupAffiliateCode: (code: string): Promise<AffiliateCodeInfo> =>
    request(`/affiliates/lookup/${encodeURIComponent(code)}`),

  trackAffiliateClick: (code: string): Promise<AffiliateCodeInfo> =>
    request(`/affiliates/lookup/${encodeURIComponent(code)}/click`, { method: 'POST' }),

  // FAQs
  getFaqs: (): Promise<Faq[]> => request('/faqs'),

  // Blog
  getArticles: (): Promise<Article[]> => request('/articles'),

  getArticle: (slug: string): Promise<Article> => request(`/articles/${encodeURIComponent(slug)}`),
};
