"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Category, getCategories } from "@/lib/publicApiService";

const tagStyles: Record<string, string> = {
  New: "bg-tertiary-container text-white",
  Popular: "bg-primary text-white",
  Trending: "bg-secondary-container text-on-secondary-container",
  Seasonal: "bg-error-container text-on-error-container",
};

const categoryIcons: Record<string, string> = {
  animals: "🐰",
  characters: "🦸",
  "food-drink": "🍧",
  nature: "🌻",
  gaming: "👾",
  "seasonal-holidays": "🎊",
  "fantasy-mythical": "🧚",
  "objects-symbols": "💎",
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
          <Link key={cat.slug} href={`/category/${cat.slug}`} className="group">
            <div className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden cursor-pointer">
              <div className="aspect-square overflow-hidden bg-secondary-container relative">
                <div className="w-full h-full flex items-center justify-center bg-surface-container">
                  <span className="text-6xl" role="img" aria-label={cat.name}>{categoryIcons[cat.slug] || "✨"}</span>
                </div>
                {categoryTags[cat.slug] && (
                  <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[categoryTags[cat.slug]] || "bg-surface-container text-on-surface-variant"}`}>
                    {categoryTags[cat.slug]}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-headline-md text-body-md">{cat.name}</h3>
                <p className="text-label-sm text-secondary mt-1">{(cat.patternCount ?? cat.count ?? 0).toLocaleString()} patterns</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
