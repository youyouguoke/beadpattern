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
  const pageUrl = `${SITE_URL}/collection/${slug}`;
  return {
    title: `${title} Perler Bead Patterns | BeadPatternAI`,
    description: data?.collection?.description || `Browse ${title} Perler bead patterns in the ${title} collection.`,
    keywords: [`${title} perler bead patterns`, `${title} fuse bead templates`, `${title} bead collection`, "pixel art templates"],
    openGraph: {
      title: `${title} Perler Bead Patterns | BeadPatternAI`,
      description: data?.collection?.description || `Browse ${title} Perler bead patterns in the ${title} collection.`,
      type: "website",
      url: pageUrl,
      siteName: "BeadPatternAI",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} Perler Bead Patterns | BeadPatternAI`,
      description: data?.collection?.description || `Browse ${title} Perler bead patterns in the ${title} collection.`,
    },
    alternates: { canonical: pageUrl },
  };
}

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  const collection = data?.collection;
  const patterns = data?.patterns ?? [];

  if (!collection) notFound();

  const pageUrl = `${SITE_URL}/collection/${collection.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: pageUrl,
    hasPart: patterns.map((p) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `${SITE_URL}/pattern/${p.slug}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE_URL}/collections` },
      { "@type": "ListItem", position: 3, name: collection.title, item: pageUrl },
    ],
  };

  const aspectRatios = ["aspect-square", "aspect-[4/3]", "aspect-[3/4]", "aspect-square"];

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="relative bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 mb-8">
          {collection.banner && (
            <div className="relative w-full h-40 md:h-56">
              <Image src={collection.banner} alt={collection.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-2">{collection.title}</h1>
            {collection.description && <p className="text-on-surface-variant font-body-lg max-w-2xl">{collection.description}</p>}
            <p className="text-on-surface-variant text-sm mt-3">{patterns.length} patterns</p>
          </div>
        </div>

        {patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-2">No patterns yet</h2>
            <p className="text-on-surface-variant font-body-md max-w-md mb-6">
              This collection is empty. Check back soon or browse all collections to find more Perler bead patterns.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {patterns.map((p, index) => (
              <Link
                key={p.slug}
                href={`/pattern/${p.slug}`}
                className="group block bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden hover:-translate-y-1 hover:border-primary/30 transition-all break-inside-avoid"
              >
                <div className={`relative ${aspectRatios[index % aspectRatios.length]}`}>
                  <Image
                    src={p.coverImage || "/fallback-pattern.png"}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <p className="font-label-sm truncate text-on-surface">{p.title}</p>
                  <p className="text-on-surface-variant text-sm">{p.gridSize} &bull; {p.colorCount} colors</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
