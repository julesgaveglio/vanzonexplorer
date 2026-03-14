import { createSupabaseAnon } from "@/lib/supabase/server";
import type { Product, Brand, Category } from "./types";

// ─── DB Row Types ────────────────────────────────────────

interface DbCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
  sort_order: number;
}

interface DbBrand {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  is_partner: boolean;
  promo_code_global: string | null;
  affiliate_url_base: string | null;
  status: string;
}

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  brand_id: DbBrand | string;
  category_id: DbCategory | string;
  description: string | null;
  long_description: string | null;
  why_this_deal: string | null;
  original_price: number;
  promo_price: number;
  discount_percent: number;
  promo_code: string | null;
  offer_type: "code_promo" | "reduction_directe" | "affiliation";
  affiliate_url: string | null;
  main_image_url: string | null;
  gallery_urls: string[];
  tags: string[];
  van_types: string[];
  is_featured: boolean;
  is_active: boolean;
  copy_count: number;
  priority_score: number;
  expires_at: string | null;
  created_at: string;
}

// ─── Transforms ─────────────────────────────────────────

function transformCategory(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    description: row.description || "",
    productCount: 0,
  };
}

function transformBrand(row: DbBrand): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo_url || `/brands/${row.slug}.svg`,
    logoPng: row.logo_url || `/brands/${row.slug}.svg`,
    description: row.description || "",
    website: row.website_url || "",
    isPartner: row.is_partner,
    isTrusted: false,
    activeOffers: 0,
    categories: [],
  };
}

function transformProduct(row: DbProduct): Product {
  const brand =
    typeof row.brand_id === "object" && row.brand_id !== null
      ? transformBrand(row.brand_id as DbBrand)
      : ({ id: row.brand_id as string, name: "", slug: "", logo: "", logoPng: "", description: "", website: "", isPartner: false, isTrusted: false, activeOffers: 0, categories: [] } as Brand);

  const category =
    typeof row.category_id === "object" && row.category_id !== null
      ? transformCategory(row.category_id as DbCategory)
      : ({ id: row.category_id as string, name: "", slug: "", icon: "Wrench", description: "", productCount: 0 } as Category);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand,
    category,
    description: row.description || "",
    longDescription: row.long_description || "",
    whyThisDeal: row.why_this_deal || "",
    image: row.main_image_url || "",
    gallery: row.gallery_urls || [],
    originalPrice: Number(row.original_price),
    promoPrice: Number(row.promo_price),
    discount: row.discount_percent,
    promoCode: row.promo_code,
    offerType: row.offer_type,
    affiliateUrl: row.affiliate_url || "",
    isFeatured: row.is_featured,
    isActive: row.is_active,
    priorityScore: row.priority_score,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

// ─── Data Fetching ───────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createSupabaseAnon();
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return (data as DbCategory[]).map(transformCategory);
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const supabase = createSupabaseAnon();
    const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single();
    if (error) throw error;
    return transformCategory(data as DbCategory);
  } catch (e) {
    console.error(`Failed to fetch category ${slug}:`, e);
    return null;
  }
}

export async function getBrands(options?: { partnerOnly?: boolean; trustedOnly?: boolean }): Promise<Brand[]> {
  try {
    const supabase = createSupabaseAnon();
    let query = supabase.from("brands").select("*").eq("status", "active").order("name");
    if (options?.partnerOnly) query = query.eq("is_partner", true);
    if (options?.trustedOnly) query = query.eq("is_trusted", true);

    const [{ data, error }, { data: productsData }] = await Promise.all([
      query,
      supabase.from("products").select("brand_id").eq("is_active", true),
    ]);
    if (error) throw error;

    const countMap: Record<string, number> = {};
    (productsData || []).forEach((p: { brand_id: string }) => {
      countMap[p.brand_id] = (countMap[p.brand_id] || 0) + 1;
    });

    return (data as DbBrand[]).map((row) => ({ ...transformBrand(row), activeOffers: countMap[row.id] || 0 }));
  } catch (e) {
    console.error("Failed to fetch brands:", e);
    return [];
  }
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    const supabase = createSupabaseAnon();
    const { data, error } = await supabase.from("brands").select("*").eq("slug", slug).eq("status", "active").single();
    if (error) throw error;
    const row = data as DbBrand;
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("brand_id", row.id).eq("is_active", true);
    return { ...transformBrand(row), activeOffers: count || 0 };
  } catch (e) {
    console.error(`Failed to fetch brand ${slug}:`, e);
    return null;
  }
}

export async function getProducts(options?: {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  try {
    const supabase = createSupabaseAnon();
    let query = supabase
      .from("products")
      .select("*, brand_id(*), category_id(*)")
      .eq("is_active", true)
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.featured) query = query.eq("is_featured", true);
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    if (options?.limit) {
      const offset = options?.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    let products = (data as DbProduct[]).map(transformProduct);
    if (options?.category) products = products.filter((p) => p.category.slug === options.category);
    if (options?.brand) products = products.filter((p) => p.brand.slug === options.brand);
    return products;
  } catch (e) {
    console.error("Failed to fetch products:", e);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createSupabaseAnon();
    const { data, error } = await supabase.from("products").select("*, brand_id(*), category_id(*)").eq("slug", slug).eq("is_active", true).single();
    if (error) throw error;
    return transformProduct(data as DbProduct);
  } catch (e) {
    console.error(`Failed to fetch product ${slug}:`, e);
    return null;
  }
}

export const getFeaturedProducts = () => getProducts({ featured: true, limit: 6 });
export const getProductsByCategory = (categorySlug: string) => getProducts({ category: categorySlug });
export const getProductsByBrand = (brandSlug: string) => getProducts({ brand: brandSlug });
export const searchProducts = (query: string) => getProducts({ search: query });
