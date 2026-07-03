"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Category, getCategories } from "@/lib/patternService";

const tagStyles: Record<string, string> = {
  New: "bg-tertiary-container text-white",
  Popular: "bg-primary text-white",
  Trending: "bg-secondary-container text-on-secondary-container",
  Seasonal: "bg-error-container text-on-error-container",
};

export default function ExploreCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="categories">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Explore Categories</h2>
          <p className="text-secondary text-sm mt-1">Browse thousands of patterns by theme</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="grid grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link key={cat.name} href={`/category/${cat.slug}`} className="group">
            <div className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden cursor-pointer">
              <div className="aspect-square overflow-hidden bg-secondary-container relative">
                <div className="w-full h-full flex items-center justify-center bg-surface-container">
                  <span className="material-symbols-outlined text-6xl text-primary/30">{cat.icon}</span>
                </div>
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[cat.tag]}`}>
                  {cat.tag}
                </span>
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                  <span className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                    <span className="material-symbols-outlined">visibility</span> Browse
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-headline-md text-body-md">{cat.name}</h3>
                <p className="text-label-sm text-secondary mt-1">{cat.count.toLocaleString()} patterns</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
