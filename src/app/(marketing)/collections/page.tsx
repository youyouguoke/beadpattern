import type { Metadata } from "next";
import Link from "next/link";
import { getCollections } from "@/lib/patternService";

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col.slug}
              href={`/collection/${col.slug}`}
              className="group block bg-white rounded-2xl p-6 border border-secondary-container shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center text-2xl">
                  {(col as { emoji?: string }).emoji ?? "🗂️"}
                </div>
                <span className="text-label-sm text-on-surface-variant">
                {(col as { count?: number }).count ?? 0} patterns
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{col.title}</h3>
            <p className="text-body-md text-on-surface-variant line-clamp-2">
              {`Explore the ${col.title} collection.`}
            </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
