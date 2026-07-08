import type { Metadata } from "next";
import { Suspense } from "react";
import PatternDetail from "@/components/pattern/PatternDetail";
import { getPatternBySlug } from "@/lib/publicApiService";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern) return { title: "Pattern Not Found | BeadPatternAI" };

  const title = pattern.seoTitle || `${pattern.title} - Perler Bead Pattern | BeadPatternAI`;
  const description = pattern.seoDescription || `Download ${pattern.title} Perler bead pattern. ${pattern.gridSize} grid, ${pattern.estimatedBeads} beads, ${pattern.difficulty} difficulty.`;
  const url = `https://beadpatternai.com/pattern/${pattern.slug}`;
  const image = pattern.coverImage || pattern.finishedImage;

  return {
    title,
    description,
    keywords: pattern.seoKeywords || `${pattern.title}, perler bead pattern, fuse bead template, beadpatternai`,
    openGraph: {
      title,
      description,
      url,
      siteName: "BeadPatternAI",
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function PatternDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern) notFound();

  return (
    <main className="px-4 md:px-12 py-8 pt-28 max-w-screen-2xl mx-auto min-h-screen bg-surface">
      <Suspense fallback={<div className="pt-28 text-center">Loading pattern...</div>}>
        <PatternDetail slug={slug} initialPattern={pattern} />
      </Suspense>
    </main>
  );
}
