import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/_next"],
    },
    sitemap: "https://beadpatternai.com/sitemap.xml",
    host: "https://beadpatternai.com",
  };
}
