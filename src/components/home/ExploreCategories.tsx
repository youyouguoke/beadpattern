"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Category, getCategories } from "@/lib/publicApiService";
import CategoryCard from "@/components/categories/CategoryCard";

const tagStyles: Record<string, string> = {
  New: "bg-tertiary-container text-white",
  Popular: "bg-primary text-white",
  Trending: "bg-secondary-container text-on-secondary-container",
  Seasonal: "bg-error-container text-on-error-container",
};

const categoryTags: Record<string, string> = {
  animals: "Popular",
  characters: "Trending",
  halloween: "Seasonal",
  christmas: "Seasonal",
  kawaii: "New",
};

export default function ExploreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  if (!categories.length) return null;

  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="categories">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Explore Categories</h2>
          <p className="text-secondary text-sm mt-1">Browse thousands of patterns by theme</p>
        </div>
        <Link href="/categories" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </section>
  );
}
