import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/publicApiService";

const BASE = "https://beadpatternai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const entries: MetadataRoute.Sitemap = [];

  entries.push(
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/patterns`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 }
  );

  for (const pattern of data.patterns || []) {
    entries.push({
      url: `${BASE}/pattern/${pattern.slug}`,
      lastModified: pattern.updatedAt ? new Date(pattern.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const cat of data.categories || []) {
    entries.push({
      url: `${BASE}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const col of data.collections || []) {
    entries.push({
      url: `${BASE}/collection/${col.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
