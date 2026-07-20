import type { Metadata } from "next";
import { getCollections } from "@/lib/publicApiService";
import CollectionCard from "@/components/collections/CollectionCard";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/collections`;

export const metadata: Metadata = {
  title: "Perler Bead Pattern Collections | BeadPatternAI",
  description: "Explore curated Perler bead pattern collections: seasonal packs, starter sets, and themed bundles to kickstart your next fuse bead project.",
  keywords: ["perler bead collections", "fuse bead bundles", "pattern collections", "seasonal bead patterns", "starter bead patterns"],
  openGraph: {
    title: "Perler Bead Pattern Collections | BeadPatternAI",
    description: "Explore curated Perler bead pattern collections for every theme and season.",
    type: "website",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perler Bead Pattern Collections | BeadPatternAI",
    description: "Explore curated Perler bead pattern collections for every theme and season.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Collections", item: PAGE_URL },
  ],
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: collections.map((col, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}/collection/${col.slug}`,
    name: col.title,
    description: col.description,
    })),
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Collections</h1>
          <p className="font-body-lg text-on-surface-variant">Explore curated pattern collections.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((col) => (
            <CollectionCard key={col.slug} collection={col} variant="page" />
          ))}
        </div>
      </div>
    </main>
  );
}
