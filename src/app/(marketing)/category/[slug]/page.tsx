import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, getCategories } from "@/lib/publicApiService";
import PatternArchive from "@/components/archive/PatternArchive";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = data?.category?.name ?? slug.replace(/-/g, " ");
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const title = `${capitalized} Perler Bead Patterns | Free Templates | BeadPatternAI`;
  const description = `Browse ${capitalized} Perler bead patterns, printable templates, color charts and step-by-step guides on BeadPatternAI.`;

  return {
    title,
    description,
    keywords: [`${capitalized} perler bead patterns`, `${capitalized.toLowerCase()} fuse bead templates`, `${capitalized.toLowerCase()} pixel art`, `${capitalized.toLowerCase()} hama bead patterns`],
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: "BeadPatternAI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = data?.category?.name ?? slug.replace(/-/g, " ");
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const description = data?.category?.description || `Explore our curated collection of ${capitalized.toLowerCase()} Perler bead templates.`;
  const allCategories = await getCategories();
  const relatedCategories = allCategories.filter((c) => c.slug !== slug).slice(0, 6);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories` },
      { "@type": "ListItem", position: 3, name: capitalized, item: pageUrl },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${capitalized} Perler Bead Patterns`,
    itemListElement: (data?.patterns ?? []).slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/pattern/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="relative bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 mb-8">
          <div className="p-6 md:p-10">
            <nav className="text-body-sm text-on-surface-variant mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
              <span className="mx-2">/</span>
              <span className="text-on-surface">{capitalized}</span>
            </nav>
            <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-3">
              {capitalized} Perler Bead Patterns
            </h1>
            <p className="text-on-surface-variant font-body-lg max-w-3xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <PatternArchive categorySlug={slug} />

        {relatedCategories.length > 0 && (
          <section className="mt-16 pt-10 border-t border-outline-variant/30">
            <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">
              Related Categories
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors font-label-md"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 pt-10 border-t border-outline-variant/30">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">
            About {capitalized} Perler Bead Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-on-surface-variant font-body-md leading-relaxed">
            <p>
              {capitalized} Perler bead patterns are some of the most popular designs for fuse-bead crafters. Whether you are looking for beginner-friendly templates or detailed masterpieces, this collection includes free printable grids, color charts, and step-by-step guides.
            </p>
            <p>
              Use the filters to narrow by difficulty, grid size, or color count. Each pattern is optimized for Perler, Hama, and Artkal beads. Download the PDF to print at 100% scale and slide under a transparent pegboard for easy crafting.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
