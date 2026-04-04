"use server";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slugify";

// ── MARQUES ──────────────────────────────────────────────────────

export async function getBrandsAdmin() {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("brands")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBrandAdmin(id: string) {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertBrand(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createSupabaseAdmin();
    const id = (formData.get("id") as string) || null;
    const name = (formData.get("name") as string)?.trim();
    const rawSlug = (formData.get("slug") as string)?.trim();

    const payload = {
      name,
      slug: rawSlug || slugify(name),
      description: (formData.get("description") as string) || null,
      website_url: (formData.get("website_url") as string) || null,
      logo_url: (formData.get("logo_url") as string) || null,
      promo_code_global: (formData.get("promo_code_global") as string) || null,
      affiliate_url_base: (formData.get("affiliate_url_base") as string) || null,
      is_partner: formData.get("is_partner") === "true",
      status: (formData.get("status") as string) || "active",
      contact_email: (formData.get("contact_email") as string) || null,
    };

    console.log("[upsertBrand] payload:", JSON.stringify(payload, null, 2));

    if (id) {
      const { error } = await sb.from("brands").update(payload).eq("id", id);
      if (error) {
        console.error("[upsertBrand] UPDATE error:", error);
        return { success: false, error: `${error.message} (code: ${error.code})` };
      }
    } else {
      const { error } = await sb.from("brands").insert(payload);
      if (error) {
        console.error("[upsertBrand] INSERT error:", error);
        return { success: false, error: `${error.message} (code: ${error.code})` };
      }
    }

    revalidatePath("/admin/club");
    revalidatePath("/admin/club/marques");
    revalidatePath("/club");
    return { success: true };
  } catch (e) {
    console.error("[upsertBrand] unexpected error:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteBrand(id: string) {
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("brands").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/club");
  revalidatePath("/admin/club/marques");
  revalidatePath("/club");
}

// ── PRODUITS ─────────────────────────────────────────────────────

export async function getProductsAdmin() {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .select("*, brand_id(id, name, slug)")
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProductAdmin(id: string) {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .select("*, brand_id(id, name, slug)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createSupabaseAdmin();
    const id = (formData.get("id") as string) || null;

    const originalPrice = parseFloat(formData.get("original_price") as string) || 0;
    const promoPrice = parseFloat(formData.get("promo_price") as string) || 0;

    const rawSlug = (formData.get("slug") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const brandId = (formData.get("brand_id") as string)?.trim() || null;
    const categoryId = (formData.get("category_id") as string)?.trim() || null;

    const payload = {
      name,
      slug: rawSlug || slugify(name),
      brand_id: brandId,
      category_id: categoryId,
      description: (formData.get("description") as string) || null,
      long_description: (formData.get("long_description") as string) || null,
      why_this_deal: (formData.get("why_this_deal") as string) || null,
      original_price: originalPrice,
      promo_price: promoPrice,
      // discount_percent est une colonne GENERATED ALWAYS — calculée automatiquement par Supabase
      promo_code: (formData.get("promo_code") as string) || null,
      offer_type: (formData.get("offer_type") as string) || "code_promo",
      affiliate_url: (formData.get("affiliate_url") as string) || null,
      main_image_url: (formData.get("main_image_url") as string) || null,
      is_featured: formData.get("is_featured") === "true",
      is_active: formData.get("is_active") !== "false",
      priority_score: parseInt(formData.get("priority_score") as string) || 0,
      expires_at: (formData.get("expires_at") as string) || null,
    };

    console.log("[upsertProduct] payload:", JSON.stringify(payload, null, 2));

    if (id) {
      const { error } = await sb.from("products").update(payload).eq("id", id);
      if (error) {
        console.error("[upsertProduct] UPDATE error:", error);
        return { success: false, error: `${error.message} (code: ${error.code})` };
      }
    } else {
      const { error } = await sb.from("products").insert(payload);
      if (error) {
        console.error("[upsertProduct] INSERT error:", error);
        return { success: false, error: `${error.message} (code: ${error.code})` };
      }
    }

    revalidatePath("/admin/club");
    revalidatePath("/admin/club/produits");
    revalidatePath("/club");
    return { success: true };
  } catch (e) {
    console.error("[upsertProduct] unexpected error:", e);
    return { success: false, error: String(e) };
  }
}

export async function deleteProduct(id: string) {
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/club");
  revalidatePath("/admin/club/produits");
  revalidatePath("/club");
}

export async function toggleProductFeatured(id: string, featured: boolean) {
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("products").update({ is_featured: featured }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/club");
  revalidatePath("/admin/club/produits");
  revalidatePath("/club");
}

export async function toggleProductActive(id: string, active: boolean) {
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("products").update({ is_active: active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/club/produits");
  revalidatePath("/club");
}

export async function reorderProducts(
  items: { id: string; priority_score: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createSupabaseAdmin();
    await Promise.all(
      items.map(({ id, priority_score }) =>
        sb.from("products").update({ priority_score }).eq("id", id)
      )
    );
    revalidatePath("/admin/club");
    revalidatePath("/admin/club/produits");
    revalidatePath("/club");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── CATÉGORIES ────────────────────────────────────────────────────

export async function getCategoriesAdmin() {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}
