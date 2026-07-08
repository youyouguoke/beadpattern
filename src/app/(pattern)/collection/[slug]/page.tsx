import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/lib/publicApiService";
import PatternArchive from "@/components/archive/PatternArchive";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  const title = data?.collection?.title ?? slug.replace(/-/g, " ");
  return {
    title: `${title} Collection - BeadPatternAI`,
    description: data?.collection?.description || `Browse ${title} Perler bead patterns in the ${title} collection.`,
  };
}

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  const title = data?.collection?.title ?? slug.replace(/-/g, " ");
  const description = data?.collection?.description;

  if (!data?.collection) notFound();

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-2">{title} Collection</h1>
          {description && <p className="text-secondary font-body-lg">{description}</p>}
        </div>
        <PatternArchive collectionSlug={slug} />
      </div>
    </main>
  );
}
