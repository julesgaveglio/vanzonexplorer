"use server";

import { adminReadClient, adminWriteClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorise");
}

// ── Actions existantes ────────────────────────────────────────────────────

export async function toggleVanFeatured(id: string, current: boolean) {
  await requireAuth();
  await adminWriteClient.patch(id).set({ featured: !current }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/vans");
}

export async function updateVanStatus(id: string, status: string) {
  await requireAuth();
  await adminWriteClient.patch(id).set({ status }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/vans");
}

// ── Fetch van complet pour l'édition ─────────────────────────────────────

const vanFullAdminQuery = groq`
  *[_type == "van" && _id == $id][0] {
    _id, name,
    "slug": slug.current,
    offerType, status, tagline, featured, sortOrder,
    "mainImageUrl": mainImage.asset->url,
    "mainImageRef": mainImage.asset->_id,
    "mainImageAlt": mainImage.alt,
    "gallery": gallery[] {
      "_key": _key,
      "ref": asset->_id,
      "url": asset->url,
      "alt": alt
    },
    vanType, brand, model, year, mileage, capacity, length,
    startingPricePerNight, salePrice,
    externalBookingUrl, externalBookingPlatform, insuranceIncluded,
    eq_bed_type, eq_bed_size,
    eq_shower, eq_shower_type, eq_toilet, eq_toilet_type,
    eq_kitchen, eq_stove_type, eq_fridge, eq_fridge_liters, eq_freezer,
    eq_heating, eq_heating_type, eq_solar, eq_solar_watts, eq_battery_ah, eq_inverter_220v,
    eq_wifi, eq_tv, eq_usb_ports, eq_bluetooth,
    eq_outdoor_awning, eq_outdoor_chairs, eq_outdoor_bbq, eq_surf_rack, eq_bike_rack,
    "descriptionBlocks": description[]{_type, _key, style, "text": children[0].text},
    highlights, rules,
    seoTitle, seoDescription
  }
`;

export async function getVanAdmin(id: string) {
  await requireAuth();
  return adminReadClient.fetch(vanFullAdminQuery, { id });
}

// ── Helpers Portable Text ─────────────────────────────────────────────────

function buildBlocks(text: string) {
  if (!text?.trim()) return [];
  return text.split("\n\n").filter(Boolean).map((para, i) => ({
    _type: "block",
    _key: `b${i}${Date.now()}`,
    style: "normal",
    children: [{ _type: "span", _key: `s${i}`, text: para.trim() }],
  }));
}


// ── Upsert van (create or update) ────────────────────────────────────────

export async function upsertVan(formData: FormData) {
  await requireAuth();

  const id = formData.get("_id") as string | null;
  const isNew = !id || id === "nouveau";

  const slugRaw = (formData.get("slug") as string || "")
    .trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const offerType = formData.getAll("offerType") as string[];

  // Images
  const mainImageRef = formData.get("mainImageRef") as string | null;
  const mainImageAlt = (formData.get("mainImageAlt") as string) || "";
  const galleryJson = formData.get("galleryJson") as string | null;
  let gallery: { _key: string; ref: string; alt: string }[] = [];
  try { gallery = galleryJson ? JSON.parse(galleryJson) : []; } catch { gallery = []; }

  const doc: Record<string, unknown> & { _type: string } = {
    _type: "van",
    name: formData.get("name"),
    slug: { _type: "slug", current: slugRaw },
    offerType,
    status: formData.get("status") || "available",
    tagline: (formData.get("tagline") as string) || undefined,
    featured: formData.get("featured") === "true",
    sortOrder: Number(formData.get("sortOrder")) || 99,

    // Médias
    ...(mainImageRef ? {
      mainImage: {
        _type: "image",
        asset: { _type: "reference", _ref: mainImageRef },
        alt: mainImageAlt,
      },
    } : {}),
    gallery: gallery.map((g, i) => ({
      _type: "image",
      _key: g._key || `gk${i}`,
      asset: { _type: "reference", _ref: g.ref },
      alt: g.alt || "",
    })),

    // Caractéristiques
    vanType: (formData.get("vanType") as string) || undefined,
    brand: (formData.get("brand") as string) || undefined,
    model: (formData.get("model") as string) || undefined,
    year: Number(formData.get("year")) || undefined,
    mileage: Number(formData.get("mileage")) || undefined,
    capacity: Number(formData.get("capacity")) || undefined,
    length: Number(formData.get("length")) || undefined,

    // Tarification
    startingPricePerNight: Number(formData.get("startingPricePerNight")) || undefined,
    salePrice: Number(formData.get("salePrice")) || undefined,
    externalBookingUrl: (formData.get("externalBookingUrl") as string) || undefined,
    externalBookingPlatform: (formData.get("externalBookingPlatform") as string) || undefined,
    insuranceIncluded: formData.get("insuranceIncluded") === "true",

    // Équipements
    eq_bed_type: (formData.get("eq_bed_type") as string) || undefined,
    eq_bed_size: (formData.get("eq_bed_size") as string) || undefined,
    eq_shower: formData.get("eq_shower") === "on",
    eq_shower_type: (formData.get("eq_shower_type") as string) || undefined,
    eq_toilet: formData.get("eq_toilet") === "on",
    eq_toilet_type: (formData.get("eq_toilet_type") as string) || undefined,
    eq_kitchen: formData.get("eq_kitchen") === "on",
    eq_stove_type: (formData.get("eq_stove_type") as string) || undefined,
    eq_fridge: formData.get("eq_fridge") === "on",
    eq_fridge_liters: Number(formData.get("eq_fridge_liters")) || undefined,
    eq_freezer: formData.get("eq_freezer") === "on",
    eq_heating: formData.get("eq_heating") === "on",
    eq_heating_type: (formData.get("eq_heating_type") as string) || undefined,
    eq_solar: formData.get("eq_solar") === "on",
    eq_solar_watts: Number(formData.get("eq_solar_watts")) || undefined,
    eq_battery_ah: Number(formData.get("eq_battery_ah")) || undefined,
    eq_inverter_220v: formData.get("eq_inverter_220v") === "on",
    eq_wifi: formData.get("eq_wifi") === "on",
    eq_tv: formData.get("eq_tv") === "on",
    eq_usb_ports: formData.get("eq_usb_ports") === "on",
    eq_bluetooth: formData.get("eq_bluetooth") === "on",
    eq_outdoor_awning: formData.get("eq_outdoor_awning") === "on",
    eq_outdoor_chairs: formData.get("eq_outdoor_chairs") === "on",
    eq_outdoor_bbq: formData.get("eq_outdoor_bbq") === "on",
    eq_surf_rack: formData.get("eq_surf_rack") === "on",
    eq_bike_rack: formData.get("eq_bike_rack") === "on",

    // Contenu
    description: buildBlocks((formData.get("description") as string) || ""),
    highlights: ((formData.get("highlights") as string) || "")
      .split("\n").map(s => s.trim()).filter(Boolean),
    rules: ((formData.get("rules") as string) || "")
      .split("\n").map(s => s.trim()).filter(Boolean),

    // SEO
    seoTitle: (formData.get("seoTitle") as string) || undefined,
    seoDescription: (formData.get("seoDescription") as string) || undefined,
  };

  if (isNew) {
    await adminWriteClient.create(doc);
  } else {
    await adminWriteClient.createOrReplace({ ...doc, _id: id! });
  }

  revalidatePath("/admin/vans");
  revalidatePath("/");
  revalidatePath("/location");

  return { ok: true };
}

export async function deleteVan(id: string) {
  await requireAuth();
  await adminWriteClient.delete(id);
  revalidatePath("/admin/vans");
  revalidatePath("/");
  return { ok: true };
}
