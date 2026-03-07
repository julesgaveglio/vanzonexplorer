/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
    unoptimized: true,
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
