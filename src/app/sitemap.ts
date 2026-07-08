import type { MetadataRoute } from "next";

const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL || "https://api.beadpatternai.com/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(`${PUBLIC_API_BASE}/sitemap.xml`);
  if (!res.ok) return [];
  const xml = await res.text();
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g)?.map((tag) => tag.replace(/<\/?loc>/g, "")) || [];
  return locs.map((loc) => ({
    url: loc,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
