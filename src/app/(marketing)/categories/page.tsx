import type { Metadata } from "next";
import { getCategories } from "@/lib/publicApiService";
import CategoryCard from "@/components/categories/CategoryCard";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/categories`;

export const metadata: Metadata = {
  title: "Perler Bead Pattern Categories | BeadPatternAI",
  description: "Browse Perler bead patterns by category: animals, gaming, food, holidays, and more. Find the perfect fuse bead template for your next project.",
  keywords: ["perler bead categories", "fuse bead themes", "bead pattern categories", "pixel art categories", "Hama bead designs"],
  openGraph: {
    title: "Perler Bead Pattern Categories | BeadPatternAI",
    description: "Browse Perler bead patterns by category: animals, gaming, food, holidays, and more.",
    type: "website",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perler Bead Pattern Categories | BeadPatternAI",
    description: "Browse Perler bead patterns by category: animals, gaming, food, holidays, and more.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Categories", item: PAGE_URL },
  ],
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categories.map((cat, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/category/${cat.slug}`,
      name: cat.name,
      description: cat.description,
    })),
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Categories</h1>
          <p className="font-body-lg text-on-surface-variant">Browse patterns by category.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} variant="page" />
          ))}
        </div>
      </div>
    </main>
  );
}
