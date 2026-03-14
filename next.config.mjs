/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native Node module — exclude from webpack bundle
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
  async redirects() {
    return [
      // Redirections précises : anciens slugs → nouveaux articles
      { source: "/blogs/bivouac-van-iraty", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/bivouac-van-iraty/", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/spots-bivouac-van-iraty", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/spots-bivouac-van-iraty/", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/comment-decouvrir-la-foret-diraty-en-van-entre-randonnees-et-bivouacs", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/comment-decouvrir-la-foret-diraty-en-van-entre-randonnees-et-bivouacs/", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/itineraire-van-foret-iraty", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/itineraire-van-foret-iraty/", destination: "/articles/foret-irati-van", permanent: true },
      { source: "/blogs/ou-dormir-en-pleine-nature-au-pays-basque-avec-un-van-amenage", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/ou-dormir-en-pleine-nature-au-pays-basque-avec-un-van-amenage/", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-legalement-van-pays-basque", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-legalement-van-pays-basque/", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-gratuitement-van-pays-basque", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/dormir-gratuitement-van-pays-basque/", destination: "/articles/ou-dormir-van-pays-basque", permanent: true },
      { source: "/blogs/surf-van-biarritz", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/surf-van-biarritz/", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/quels-conseils-pour-combiner-surf-et-vanlife-au-pays-basque", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/quels-conseils-pour-combiner-surf-et-vanlife-au-pays-basque/", destination: "/articles/surf-vanlife-biarritz", permanent: true },
      { source: "/blogs/rhune-iraty-villages-van-trip", destination: "/articles/rhune-randonnee-van", permanent: true },
      { source: "/blogs/rhune-iraty-villages-van-trip/", destination: "/articles/rhune-randonnee-van", permanent: true },
      // Catch-all : tous les autres /blogs/* → /articles/
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
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy", value: "upgrade-insecure-requests" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
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
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
