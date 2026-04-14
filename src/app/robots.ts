import type { MetadataRoute } from "next";

const BASE_URL = "https://vanzonexplorer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/user/", "/sign-in/", "/sign-up/", "/studio/", "/admin/", "/club/deals/", "/club/marques/", "/club/categories/", "/pixel-agents/", "/van-business-academy/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
