// Base types (extended from frontend)
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  nameSv?: string | null;
  descriptionSv?: string | null;
  shortDescriptionSv?: string | null;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  stockLevel?: number;
  isActive: boolean;
  isVisible: boolean;
  extendedInfo?: {
    specifications: string[];
    usage: string;
    storage: string;
    warnings: string[];
  };
  extendedInfoSv?: {
    specifications: string[];
    usage: string;
    storage: string;
    warnings: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  affiliateId?: string | null;
  affiliateCode?: string | null;
  commission?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'product' | 'order' | 'user' | 'review' | 'system';
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  activeProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  salesByMonth: { month: string; sales: number }[];
  ordersByStatus: { status: string; count: number }[];
}

export interface AuthResponse {
  user: AdminUser;
  token: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  questionSv?: string | null;
  answerSv?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  titleSv?: string | null;
  slug: string;
  content: string;
  contentSv?: string | null;
  metaDescription?: string | null;
  metaDescriptionSv?: string | null;
  featuredImage?: string | null;
  isPublished: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}


export interface AffiliateStats {
  paidOrders: number;
  pendingOrders: number;
  sales: number;
  commissionEarned: number;
  paidOut: number;
  owed: number;
}

export interface Affiliate {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  commissionPercent: number;
  discountPercent: number;
  clicks: number;
  isActive: boolean;
  notes?: string | null;
  link: string;
  stats: AffiliateStats;
  createdAt: string;
  updatedAt: string;
}

export type AffiliateInput = Pick<
  Affiliate,
  'name' | 'code' | 'commissionPercent' | 'discountPercent' | 'isActive'
> & { email?: string; notes?: string };

export interface AffiliateOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  total: number;
  commission: number;
}

export interface AffiliatePayout {
  id: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

export interface AffiliateDetails extends Affiliate {
  orders: AffiliateOrder[];
  payouts: AffiliatePayout[];
}

export interface LabReport {
  id: string;
  productId: string;
  image: string;
  batchNumber: string | null;
  // YYYY-MM-DD
  testDate: string | null;
  createdAt: string;
}

export type LabReportInput = {
  productId: string;
  image: string;
  batchNumber?: string;
  testDate?: string;
};
