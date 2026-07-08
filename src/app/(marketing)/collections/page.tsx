import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCollections } from "@/lib/publicApiService";

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
            <Link
              key={col.slug}
              href={`/collection/${col.slug}`}
              className="group block bg-white rounded-2xl border border-secondary-container overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              {col.banner ? (
                <div className="relative w-full h-40">
                  <Image src={col.banner} alt={col.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
              ) : (
                <div className="w-full h-40 bg-secondary-container text-on-secondary-container flex items-center justify-center text-4xl">
                  {col.emoji ?? "🗂️"}
                </div>
              )}
              <div className="p-5">
                <p className="text-label-sm text-on-surface-variant mb-2">
                  {col.patternCount ?? col.count ?? 0} patterns
                </p>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{col.title}</h3>
                <p className="text-body-md text-on-surface-variant line-clamp-2">
                  {col.description || `Explore the ${col.title} collection.`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
