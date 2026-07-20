import type { Metadata } from "next";
import PatternArchive from "@/components/archive/PatternArchive";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";

export async function generateMetadata({ searchParams }: { searchParams?: Promise<{ q?: string }> }): Promise<Metadata> {
  const query = (await searchParams)?.q || "";
  const pageUrl = `${SITE_URL}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const title = query
    ? `"${query}" Perler Bead Patterns | Search Results | BeadPatternAI`
    : "Search Perler Bead Patterns | BeadPatternAI";
  const description = query
    ? `Find Perler bead patterns matching "${query}". Download free printable PDF and PNG templates with color charts.`
    : "Search hundreds of Perler bead patterns by theme, character, or color. Filter by difficulty and grid size.";

  return {
    title,
    description,
    keywords: [query ? `${query} perler bead pattern` : "search perler bead patterns", "fuse bead templates", "pixel art search", "Hama bead patterns"],
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: "BeadPatternAI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const query = (await searchParams)?.q || "";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Search", item: `${SITE_URL}/search` },
      ...(query ? [{ "@type": "ListItem", position: 3, name: query, item: `${SITE_URL}/search?q=${encodeURIComponent(query)}` }] : []),
    ],
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <PatternArchive searchQuery={query} />
      </div>
    </main>
  );
}
