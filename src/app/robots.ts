import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/user/", "/sign-in/", "/sign-up/", "/studio/", "/admin/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
