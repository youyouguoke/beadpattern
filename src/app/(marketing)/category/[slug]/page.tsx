import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug, getCategories } from "@/lib/publicApiService";
import PatternArchive from "@/components/archive/PatternArchive";
import JsonLd from "@/components/seo/JsonLd";
import ClientImage from "@/components/ClientImage";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = slug === "animals" ? "Animal" : (data?.category?.name ?? slug.replace(/-/g, " "));
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const title = `${capitalized} Perler Bead Patterns | Free Templates | BeadPatternAI`;
  const description = `Browse ${capitalized} Perler bead patterns, printable templates, color charts and step-by-step guides on BeadPatternAI.`;

  return {
    title,
    description,
    keywords: [`${capitalized} perler bead patterns`, `${capitalized.toLowerCase()} fuse bead templates`, `${capitalized.toLowerCase()} pixel art`, `${capitalized.toLowerCase()} hama bead patterns`],
    openGraph: { title, description, type: "website", url: pageUrl, siteName: "BeadPatternAI" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: pageUrl },
  };
}

const animalSubcategories = [
  { name: "Cats", slug: "cat", color: "bg-primary-fixed", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-cat.png" },
  { name: "Dogs", slug: "dog", color: "bg-secondary-fixed", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-dog.png" },
  { name: "Bunnies", slug: "bunny", color: "bg-tertiary-fixed", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-rabbit.png" },
  { name: "Pandas", slug: "panda", color: "bg-outline-variant", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/detailed-panda.png" },
  { name: "Foxes", slug: "fox", color: "bg-primary-fixed-dim", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-fox.png" },
  { name: "Penguins", slug: "penguin", color: "bg-secondary-container", image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-penguin.png" },
];

const animalHeroImage = "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/finished/cute-cat.png";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  const name = slug === "animals" ? "Animal" : (data?.category?.name ?? slug.replace(/-/g, " "));
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const pageUrl = `${SITE_URL}/category/${slug}`;
  const description = data?.category?.description || `Explore our curated collection of ${capitalized.toLowerCase()} Perler bead templates.`;
  const allCategories = await getCategories();
  const relatedCategories = allCategories.filter((c) => c.slug !== slug).slice(0, 6);
  const isAnimals = slug === "animals";

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
    <main className={`min-h-screen ${isAnimals ? "bg-[#fcf9f8]" : "bg-surface"}`}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        {/* Breadcrumb */}
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{capitalized}</span>
        </nav>

        {isAnimals ? (
          <>
            {/* Hero Section */}
            <section className="relative overflow-hidden py-12 md:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div className="z-10">
                  <span className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-label-sm font-bold mb-6 uppercase tracking-wider">
                    Artisanal Pixel Crafts
                  </span>
                  <h1 className="font-quicksand text-display-lg-mobile md:text-display-lg text-on-background mb-6">
                    Animal Perler Bead Patterns
                  </h1>
                  <p className="font-plus-jakarta text-body-lg text-on-surface-variant mb-8 max-w-xl">
                    Create cute animal crafts with beginner-friendly bead grids. From charming woodland foxes to kawaii pandas, start your next tactile masterpiece today.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/patterns?category=animals"
                      className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-lg shadow-soft hover:shadow-lg transition-all active:scale-95"
                    >
                      Browse 500+ Animals
                    </Link>
                    <Link
                      href="/blog/beginner-guide-to-perler-beads"
                      className="bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-high transition-all"
                    >
                      How it Works
                    </Link>
                  </div>
                </div>

                <div className="relative">
                  <div className="aspect-square rounded-[2.5rem] overflow-hidden shadow-soft rotate-2 border-8 border-white bg-surface-container-low">
                    <ClientImage
                      src={animalHeroImage}
                      alt="Animal Perler Bead Patterns"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute -bottom-6 -left-6 bg-secondary-container p-6 rounded-3xl shadow-xl -rotate-6 hidden md:block">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">auto_awesome</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-secondary-container">100% Original</p>
                        <p className="text-xs text-on-secondary-container/80">Designer patterns</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Shop by Spirit Animal */}
            <section className="py-16 md:py-24 px-4 md:px-0 bg-surface-container-low rounded-[2.5rem] my-8">
              <div className="text-center mb-12">
                <h2 className="font-quicksand text-display-lg-mobile md:text-display-lg mb-4 text-on-surface">
                  Shop by Spirit Animal
                </h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">
                  Quickly find the perfect project by exploring our most popular animal categories.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {animalSubcategories.map((sub) => (
                  <Link key={sub.slug} href={`/patterns?q=${sub.slug}`} className="group block">
                    <div className="bg-white p-4 rounded-3xl shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_30px_0_rgba(173,44,78,0.1)] text-center">
                      <div className={`aspect-square rounded-2xl overflow-hidden mb-4 ${sub.color}`}>
                        <ClientImage
                          src={sub.image}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <span className="font-quicksand font-bold text-on-surface">{sub.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="relative bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 mb-8">
            <div className="p-6 md:p-10">
              <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-3">
                {capitalized} Perler Bead Patterns
              </h1>
              <p className="text-on-surface-variant font-body-lg max-w-3xl leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        )}

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
