"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Category, getCategories } from "@/lib/publicApiService";
import CategoryCard from "@/components/categories/CategoryCard";

export default function ExploreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  if (!categories.length) return null;

  return (
    <section className="bg-surface py-16 md:py-24" id="categories">
      <div className="container-main">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title text-primary">Explore Categories</h2>
            <p className="section-subtitle mt-2">Browse thousands of patterns by theme</p>
          </div>
          <Link href="/categories" className="text-label-md text-on-surface-variant hover:text-primary flex items-center gap-1">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
