import type { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/publicApiService";
import PatternArchive from "@/components/archive/PatternArchive";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = data?.category?.name ?? slug.replace(/-/g, " ");
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    title: `${capitalized} Bead Patterns - BeadPatternAI`,
    description: `Browse ${capitalized} Perler bead patterns, printable templates, color charts and step-by-step guides on BeadPatternAI.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = data?.category?.name ?? slug.replace(/-/g, " ");
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <main className="pt-8 pb-20 px-4 md:px-12 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-lg text-display-lg-mobile text-primary mb-2">{capitalized} Bead Patterns</h1>
        <p className="text-secondary font-body-lg">Explore our curated collection of {capitalized.toLowerCase()} Perler bead templates.</p>
      </div>
      <PatternArchive categorySlug={slug} />
    </main>
  );
}
