import { groq } from "next-sanity";

// ── Projection image réutilisable ──
const imageProjection = `{
  "url": asset->url,
  "alt": alt
}`;

// ── Projection card (champs résumés pour le catalogue) ──
const vanCardProjection = `{
  _id,
  name,
  "slug": slug.current,
  offerType,
  tagline,
  "mainImage": mainImage ${imageProjection},
  vanType,
  capacity,
  startingPricePerNight,
  salePrice,
  externalBookingUrl,
  externalBookingPlatform,
  insuranceIncluded,
  featured,
  highlights,
  eq_shower,
  eq_toilet,
  eq_kitchen,
  eq_wifi,
  eq_surf_rack,
  eq_outdoor_awning,
  eq_bike_rack
}`;

// ── Projection complète (fiche détaillée) ──
const vanFullProjection = `{
  _id,
  name,
  "slug": slug.current,
  offerType,
  status,
  tagline,
  description,
  "mainImage": mainImage ${imageProjection},
  "gallery": gallery[] ${imageProjection},
  vanType,
  brand,
  model,
  year,
  mileage,
  capacity,
  length,
  startingPricePerNight,
  salePrice,
  externalBookingUrl,
  externalBookingPlatform,
  insuranceIncluded,
  eq_bed_type,
  eq_bed_size,
  eq_shower,
  eq_shower_type,
  eq_toilet,
  eq_toilet_type,
  eq_kitchen,
  eq_stove_type,
  eq_fridge,
  eq_fridge_liters,
  eq_freezer,
  eq_heating,
  eq_heating_type,
  eq_solar,
  eq_solar_watts,
  eq_battery_ah,
  eq_inverter_220v,
  eq_wifi,
  eq_tv,
  eq_usb_ports,
  eq_bluetooth,
  eq_outdoor_awning,
  eq_outdoor_chairs,
  eq_outdoor_bbq,
  eq_surf_rack,
  eq_bike_rack,
  highlights,
  rules,
  seoTitle,
  seoDescription,
  featured,
  sortOrder
}`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Tous les vans en location (disponibles)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllLocationVansQuery = groq`
  *[_type == "van" && "location" in offerType && status == "available"]
  | order(featured desc, sortOrder asc)
  ${vanCardProjection}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Un van par slug (fiche complète)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getVanBySlugQuery = groq`
  *[_type == "van" && slug.current == $slug][0]
  ${vanFullProjection}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Tous les vans à vendre (non vendus)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllSaleVansQuery = groq`
  *[_type == "van" && "achat" in offerType && status != "sold"]
  | order(sortOrder asc)
  ${vanCardProjection}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Vans vedettes (page d'accueil, max 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getFeaturedVansQuery = groq`
  *[_type == "van" && featured == true][0...3]
  | order(sortOrder asc)
  ${vanCardProjection}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Tous les témoignages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllTestimonialsQuery = groq`
  *[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    name,
    role,
    content,
    rating,
    "photo": photo ${imageProjection},
    featured
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Tous les spots Pays Basque
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllSpotsQuery = groq`
  *[_type == "spotPaysBasque"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    category,
    description,
    "mainImage": mainImage ${imageProjection},
    "gallery": gallery[] ${imageProjection},
    coordinates,
    highlights,
    seoTitle,
    seoDescription
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Slugs pour generateStaticParams
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllVanSlugsQuery = groq`
  *[_type == "van" && defined(slug.current)] {
    "slug": slug.current
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Médiathèque — images par catégorie
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getMediaByCategoryQuery = groq`
  *[_type == "mediaAsset" && category == $category] | order(title asc) {
    _id,
    title,
    category,
    tags,
    usedIn,
    image {
      asset->{
        _id,
        url,
        metadata { dimensions, lqip }
      },
      alt,
      credit,
      hotspot,
      crop
    }
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. Médiathèque — toutes les images
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getAllMediaAssetsQuery = groq`
  *[_type == "mediaAsset"] | order(category asc, title asc) {
    _id,
    title,
    category,
    tags,
    usedIn,
    image {
      asset->{
        _id,
        url,
        metadata { dimensions, lqip }
      },
      alt
    }
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. Hero image (par titre) - BACKUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getHeroImageQuery = groq`
  *[_type == "mediaAsset" && title == "van-sur-la-route-montagne-océan"][0] {
    image {
      asset->{
        _id,
        url,
        metadata { dimensions, lqip }
      },
      alt
    }
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. Hero carousel images (NOUVEAU)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getHeroCarouselQuery = groq`
  *[_type == "heroImages" && isActive == true][0] {
    _id,
    title,
    isActive,
    "images": images[] {
      "url": image.asset->url,
      "alt": image.alt,
      "title": title,
      "metadata": image.asset->metadata {
        dimensions,
        lqip
      }
    }
  }
`;
