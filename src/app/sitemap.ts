import type { MetadataRoute } from "next";
import { getCategories, getCollections, getPublishedPatterns } from "@/lib/publicApiService";

const SITE_URL = "https://beadpatternai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, collections, patterns] = await Promise.all([
    getCategories().catch(() => []),
    getCollections().catch(() => []),
    getPublishedPatterns({ limit: 1000 }).catch(() => []),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/patterns`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/generate`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/inspiration`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  const categoryUrls = categories.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const collectionUrls = collections.map((c) => ({
    url: `${SITE_URL}/collection/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const patternUrls = patterns.map((p) => ({
    url: `${SITE_URL}/pattern/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticUrls, ...categoryUrls, ...collectionUrls, ...patternUrls];
}
