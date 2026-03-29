/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native Node module — exclude from webpack bundle
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
  async redirects() {
    return [
      // ── Forêt d'Iraty ──────────────────────────────────────────────────────
      { source: "/blogs/bivouac-van-iraty/:path*", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/spots-bivouac-van-iraty/:path*", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/comment-decouvrir-la-foret-diraty-en-van-entre-randonnees-et-bivouacs/:path*", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/itineraire-van-foret-iraty/:path*", destination: "/articles/foret-irati-van", permanent: true },

      // ── Où dormir en van (réglementation + bivouac) ────────────────────────
      { source: "/blogs/reglementation-van-euskadi/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/reglementation-vanlife-bab/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-legalement-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-gratuitement-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/ou-dormir-en-pleine-nature-au-pays-basque-avec-un-van-amenage/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-van-hendaye/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-van-hendaye-2/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/amendes-nuit-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/camping-sauvage-van-pays-basque-2/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/camping-sauvage-van-pays-basque-3/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/ou-stationner-son-van-au-pays-basque-quelles-aires-de-camping-car-et-parkings-autorises/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/spots-nuit-autorises-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-van-bord-de-mer-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-voiture-espagne/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/aires-gratuites-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-ou-on-veut-van/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/lois-dormir-van-euskadi/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-van-loi-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      // root-level
      { source: "/reglementation-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/camping-sauvage-van-pays-basque/:path*", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },

      // ── Recettes / repas en van ────────────────────────────────────────────
      { source: "/blogs/recettes-sans-frigo-en-van/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/recettes-faciles-en-van/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/recettes-faciles-van-road-trip/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/recettes-vegetariennes-roadtrip/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/petit-dejeuner-van/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/menu-2-jours-roadtrip-van/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/cuisine-exterieure-pratique-van/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/apero-vanlife/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      { source: "/blogs/quoi-manger-road-trip/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },
      // root-level
      { source: "/recettes-faciles-van-road-trip/:path*", destination: "/articles/repas-sans-frigo-van", permanent: true },

      // ── Surf & Biarritz ────────────────────────────────────────────────────
      { source: "/blogs/surf-van-biarritz/:path*", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/quels-conseils-pour-combiner-surf-et-vanlife-au-pays-basque/:path*", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/comment-organiser-un-surf-trip-en-van-de-5-jours-entre-biarritz-et-mundaka/:path*", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/plages-van-biarritz/:path*", destination: "/articles/surf-vanlife-biarritz", permanent: true },

      // ── La Rhune / randonnées ──────────────────────────────────────────────
      { source: "/blogs/rhune-iraty-villages-van-trip/:path*", destination: "/articles/rhune-randonnee-van", permanent: true },
      { source: "/blogs/marcher-pays-basque/:path*", destination: "/articles/rhune-randonnee-van", permanent: true },
      { source: "/blogs/roadtrip-5-jours-meilleures-randonnees-pays-basque/:path*", destination: "/articles/rhune-randonnee-van", permanent: true },

      // ── Road trip / itinéraires Pays Basque ────────────────────────────────
      { source: "/blogs/roadtrip-5-jours-pays-basque/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/itineraire-3-jours-van-pays-basque/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/roadtrip-4-jours-pays-basque/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/itineraire-vanlife-entre-saint-jean-de-luz-et-bilbao-surf-pintxos-et-panoramas/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/le-seul-blog-dont-vous-avez-besoin-pour-un-road-trip-en-van-dans-les-pyrenees-7-jours-daventure-inoubliables-entre-montagnes-et-vallees/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/itineraires-van-pays-basque/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      { source: "/blogs/preparer-road-trip-van/:path*", destination: "/road-trip-pays-basque-van", permanent: true },
      // root-level
      { source: "/roadtrip-5-jours-surf-pays-basque/:path*", destination: "/road-trip-pays-basque-van", permanent: true },

      // ── Pages location par ville ───────────────────────────────────────────
      { source: "/blogs/parking-van-biarritz/:path*", destination: "/location/biarritz", permanent: true },
      { source: "/blogs/van-guethary-bons-plans/:path*", destination: "/location/biarritz", permanent: true },
      { source: "/blogs/van-roadtrip-biarritz/:path*", destination: "/location/biarritz", permanent: true },
      { source: "/blogs/dormir-van-saint-jean-de-luz/:path*", destination: "/location/saint-jean-de-luz", permanent: true },
      { source: "/blogs/saint-jean-de-luz-itineraire-van/:path*", destination: "/location/saint-jean-de-luz", permanent: true },
      { source: "/blogs/van-itineraire-bayonne-culture/:path*", destination: "/location/bayonne", permanent: true },
      { source: "/blogs/spots-gratuits-bayonne/:path*", destination: "/location/bayonne", permanent: true },
      { source: "/blogs/van-hendaye-vue-ocean/:path*", destination: "/location/hossegor", permanent: true },
      { source: "/blogs/stationner-van-san-sebastian-hauteur/:path*", destination: "/location", permanent: true },
      // root-level
      { source: "/location-van-surf-pays-basque/:path*", destination: "/location", permanent: true },

      // ── Pays Basque général ────────────────────────────────────────────────
      { source: "/blogs/eau-van-pays-basque/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/van-pays-basque-hiver/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/escapade-romantique-van/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/vanlife-ainhoa/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/automne-van-ainhoa/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/nature-vanlife-ainhoa/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/voyager-van-animal-pays-basque/:path*", destination: "/pays-basque", permanent: true },
      { source: "/blogs/quand-partir-pays-basque/:path*", destination: "/pays-basque", permanent: true },
      // root-level
      { source: "/quand-partir-van-pays-basque/:path*", destination: "/pays-basque", permanent: true },

      // ── Achat / équipement van ─────────────────────────────────────────────
      { source: "/blogs/equipements-indispensables-van/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/code-route-van-amenage/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/matelas-confortable-van-amenage/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/isolation-van-hiver-efficace/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/installer-douche-van-amenage/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/douche-solaire-hiver-van/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/recharger-batterie-auxiliaire-van/:path*", destination: "/achat", permanent: true },
      { source: "/blogs/rangement-van-amenage-astuces/:path*", destination: "/achat", permanent: true },
      // root-level
      { source: "/accessoires-road-trip-van/:path*", destination: "/achat", permanent: true },
      { source: "/astuces-road-trip-van/:path*", destination: "/achat", permanent: true },

      // ── Catch-all : /blogs/* et /blogarticles/* restants → /articles ───────
      { source: "/blogs/:slug*", destination: "/articles", permanent: true },
      { source: "/blogarticles/:slug*", destination: "/articles", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "www.destination-biarritz.fr" },
      { protocol: "https", hostname: "hossegor-surf.fr" },
      { protocol: "https", hostname: "www.saint-jean-de-luz.com" },
      { protocol: "https", hostname: "media.sudouest.fr" },
      { protocol: "https", hostname: "www.rhune.com" },
      { protocol: "https", hostname: "www.tourisme64.com" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "www.vanlifemag.fr" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // SERPAPI Google Images — thumbnails sur Google CDN
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn1.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn2.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn3.gstatic.com" },
      // Originals SERPAPI — sources variées (tourisme, presse, Wikipedia)
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.wikipedia.org" },
      { protocol: "https", hostname: "static.actu.fr" },
      { protocol: "https", hostname: "**.tourisme64.com" },
      { protocol: "https", hostname: "**.linternaute.com" },
      { protocol: "https", hostname: "**.sudouest.fr" },
      { protocol: "https", hostname: "**.biarritz.fr" },
      { protocol: "https", hostname: "**.bayonne.fr" },
      { protocol: "https", hostname: "**.saint-jean-de-luz.com" },
      { protocol: "https", hostname: "**.hossegor.fr" },
      { protocol: "https", hostname: "**.surf-report.fr" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
