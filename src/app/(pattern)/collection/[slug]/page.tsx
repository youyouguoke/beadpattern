import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/lib/publicApiService";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL = "https://beadpatternai.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  const title = data?.collection?.title ?? slug.replace(/-/g, " ");
  return {
    title: `${title} | BeadPatternAI`,
    description: data?.collection?.description || `Browse ${title} Perler bead patterns in the ${title} collection.`,
  };
}

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  const collection = data?.collection;
  const patterns = data?.patterns ?? [];

  if (!collection) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: `${SITE_URL}/collection/${collection.slug}`,
    hasPart: patterns.map((p) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `${SITE_URL}/pattern/${p.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={structuredData} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="relative bg-surface-container rounded-2xl overflow-hidden mb-8">
          {collection.banner && (
            <div className="relative w-full h-40 md:h-56">
              <Image src={collection.banner} alt={collection.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-2">{collection.title}</h1>
            {collection.description && <p className="text-secondary font-body-lg max-w-2xl">{collection.description}</p>}
            <p className="text-secondary text-sm mt-3">{patterns.length} patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {patterns.map((p) => (
            <Link key={p.slug} href={`/pattern/${p.slug}`} className="bg-white rounded-2xl border border-secondary-container overflow-hidden hover:-translate-y-1 transition-transform">
              <div className="relative aspect-square">
                <Image src={p.coverImage || "/fallback-pattern.png"} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
              </div>
              <div className="p-3">
                <p className="font-label-sm truncate">{p.title}</p>
                <p className="text-secondary text-sm">{p.gridSize} &bull; {p.colorCount} colors</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
