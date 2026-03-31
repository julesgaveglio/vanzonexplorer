import type { MetadataRoute } from "next";

const BASE_URL = "https://vanzonexplorer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/user/", "/sign-in/", "/sign-up/", "/studio/", "/admin/", "/club/dashboard/", "/club/deals/", "/club/marques/", "/club/onboarding/", "/club/categories/", "/pixel-agents/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
