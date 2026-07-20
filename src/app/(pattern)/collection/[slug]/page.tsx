import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getCollections } from "@/lib/publicApiService";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import CollectionCard from "@/components/collections/CollectionCard";
import PatternFaq from "@/components/pattern/PatternFaq";

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

  const allCollections = await getCollections();
  const relatedCollections = allCollections
    .filter((c) => c.slug !== collection.slug && c.patternCount && c.patternCount > 0)
    .slice(0, 4);

  const featuredPatterns = patterns.slice(0, 4);
  const gridPatterns = patterns;

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

  const collectionFaqs = [
    { id: "1", question: `What is the ${collection.title} collection?`, answer: `The ${collection.title} collection gathers Perler bead patterns around a common theme, ready to download and craft.`, patternId: "", displayOrder: 0 },
    { id: "2", question: "Are these patterns free to download?", answer: "Yes. Every pattern in this collection includes a free printable PDF and PNG template for personal use.", patternId: "", displayOrder: 1 },
    { id: "3", question: "How do I choose the right pattern for my skill level?", answer: "Each pattern card shows the difficulty and grid size. Start with easy patterns if you are new to fuse beads.", patternId: "", displayOrder: 2 },
  ];

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbSchema} />

      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        {/* Breadcrumb */}
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-primary transition-colors">Collections</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{collection.title}</span>
        </nav>

        {/* Hero banner */}
        <section className="relative bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 mb-10">
          {collection.banner ? (
            <div className="relative w-full h-48 md:h-72">
              <Image src={collection.banner} alt={collection.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-48 md:h-72 bg-primary-container/30 flex items-center justify-center">
              <span className="text-8xl">✨</span>
            </div>
          )}
          <div className="p-6 md:p-8">
            <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-3">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-on-surface-variant font-body-lg max-w-2xl">{collection.description}</p>
            )}
            <p className="text-on-surface-variant text-sm mt-4">{patterns.length} patterns</p>
          </div>
        </section>

        {patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">inbox</span>
            </div>
            <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-2">No patterns yet</h2>
            <p className="text-on-surface-variant font-body-md max-w-md mb-6">
              This collection is empty. Check back soon or browse all collections to find more Perler bead patterns.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Browse Collections
            </Link>
          </div>
        ) : (
          <>
            {/* Featured patterns */}
            {featuredPatterns.length > 0 && (
              <section className="mb-12">
                <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Featured Patterns</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featuredPatterns.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/pattern/${p.slug}`}
                      className="group block bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden hover:-translate-y-1 hover:border-primary/30 transition-all"
                    >
                      <div className="relative aspect-square">
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
              </section>
            )}

            {/* Pattern grid */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-quicksand font-bold text-headline-md text-on-surface">All Patterns</h2>
                <span className="text-on-surface-variant text-sm">{gridPatterns.length} results</span>
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {gridPatterns.map((p, index) => {
                  const aspectRatios = ["aspect-square", "aspect-[4/3]", "aspect-[3/4]", "aspect-square"];
                  return (
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
                        <p className="text-on-surface-variant text-sm">{p.difficulty} &bull; {p.gridSize} &bull; {p.colorCount} colors</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Related collections */}
        {relatedCollections.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-quicksand font-bold text-headline-md text-on-surface">Related Collections</h2>
              <Link href="/collections" className="text-on-surface-variant font-label-sm flex items-center gap-1 hover:text-primary transition-colors">
                View All <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedCollections.map((c) => (
                <CollectionCard key={c.slug} collection={c} variant="page" />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <PatternFaq faqs={collectionFaqs} title={`${collection.title} FAQs`} />
        </section>
      </div>
    </main>
  );
}
