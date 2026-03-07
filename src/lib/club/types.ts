export type OfferType = "code_promo" | "reduction_directe" | "affiliation";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  logoPng: string;
  description: string;
  website: string;
  isPartner: boolean;
  isTrusted: boolean;
  activeOffers: number;
  categories: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: Brand;
  category: Category;
  description: string;
  longDescription: string;
  whyThisDeal: string;
  image: string;
  gallery: string[];
  originalPrice: number;
  promoPrice: number;
  discount: number;
  promoCode: string | null;
  offerType: OfferType;
  affiliateUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface SavedDeal {
  id: string;
  productId: string;
  product: Product;
  savedAt: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  product: Product;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}
