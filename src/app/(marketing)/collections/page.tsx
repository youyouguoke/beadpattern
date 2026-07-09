import type { Metadata } from "next";
import { getCollections } from "@/lib/publicApiService";
import CollectionCard from "@/components/collections/CollectionCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections - BeadPatternAI",
  description: "Browse Perler bead pattern collections on BeadPatternAI.",
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Collections</h1>
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
