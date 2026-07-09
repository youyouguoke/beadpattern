import type { Metadata } from "next";
import { getCategories } from "@/lib/publicApiService";
import CategoryCard from "@/components/categories/CategoryCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories - BeadPatternAI",
  description: "Browse Perler bead pattern categories on BeadPatternAI.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">Categories</h1>
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
