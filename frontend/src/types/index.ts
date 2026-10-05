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
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  userId?: string;
  guestId?: string;
}

export interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentType: 'card' | 'crypto';
  currency: string;
  affiliateCode?: string;
}

// What the storefront may know about an affiliate code — never commission.
export interface AffiliateCodeInfo {
  code: string;
  discountPercent: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CryptoCoinOption {
  path: string;
  network: string | null;
  ticker: string;
  name: string;
  logo: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  questionSv?: string | null;
  answerSv?: string | null;
  order: number;
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


export interface LabReport {
  id: string;
  productId: string;
  image: string;
  batchNumber: string | null;
  // YYYY-MM-DD
  testDate: string | null;
  createdAt: string;
  product?: { id: string; name: string; nameSv: string | null; image: string };
}
