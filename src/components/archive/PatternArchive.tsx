"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories, getAllPatterns, Pattern } from "@/lib/patternService";

const difficulties = [
  { id: "easy", label: "Beginner" },
  { id: "medium", label: "Intermediate" },
  { id: "hard", label: "Advanced" },
];

const sizes = ["16x16", "24x24", "32x32", "48x48", "64x64"];

function difficultyColor(diff: string) {
  switch (diff) {
    case "Easy": return "bg-tertiary-container text-white";
    case "Medium": return "bg-secondary-container text-on-secondary-container";
    case "Hard": return "bg-error-container text-on-error-container";
    default: return "bg-surface-variant text-on-surface-variant";
  }
}

interface PatternArchiveProps {
  searchQuery?: string;
  collectionSlug?: string;
}

export default function PatternArchive({ searchQuery = "", collectionSlug = "" }: PatternArchiveProps) {
  const [query, setQuery] = useState(searchQuery);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedDiffs, setSelectedDiffs] = useState<Record<string, boolean>>({ easy: true, medium: true, hard: false });
  const [sort, setSort] = useState("Most Recent");

  useEffect(() => {
    getAllPatterns().then(setAllPatterns);
  }, []);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(["All", ...cats.map((c) => c.name)]);
    });
  }, []);

  const toggleDiff = (id: string) => {
    setSelectedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPatterns = allPatterns.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = q === "" || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "All" || p.title.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSize = selectedSize === null || p.grid === selectedSize;
    const matchesDiff = selectedDiffs[p.difficulty.toLowerCase()];
    return matchesQuery && matchesCategory && matchesSize && matchesDiff;
  });

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center md:text-left">
        <div className="max-w-3xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Browse Patterns"}
          </h1>
          <p className="font-body-lg text-on-surface-variant mb-8 leading-relaxed">
            Search thousands of printable Perler bead patterns by keyword, category, or grid size. Not found? Create one with AI.
          </p>
          <div className="flex w-full max-w-xl bg-white rounded-2xl p-2 border border-secondary-container shadow-sm">
            <input
              className="flex-1 px-4 py-2 bg-transparent outline-none"
              placeholder="Search patterns, e.g. frog, ghost..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Link href={`/search?q=${encodeURIComponent(query)}`} className="bg-primary-container text-white px-5 py-2 rounded-xl text-sm font-medium">
              Search
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-secondary-container space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md">Filters</h3>
                <button
                  className="text-label-sm text-primary hover:underline"
                  onClick={() => { setSelectedCategory("All"); setSelectedSize(null); setSelectedDiffs({ easy: true, medium: true, hard: false }); setQuery(""); }}
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Difficulty</p>
                <div className="space-y-2">
                  {difficulties.map((d) => (
                    <label key={d.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedDiffs[d.id]}
                        onChange={() => toggleDiff(d.id)}
                        className="w-5 h-5 rounded border-2 border-secondary text-primary focus:ring-primary"
                      />
                      <span className="text-body-md group-hover:text-primary">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container text-on-surface-variant hover:bg-primary-fixed"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Grid Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`px-3 py-1.5 rounded-lg text-label-sm transition-colors ${
                        selectedSize === size
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container text-on-surface-variant hover:bg-primary-fixed"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          <div className="flex items-center justify-between mb-6">
            <span className="text-on-surface-variant">{filteredPatterns.length} patterns found</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Sort by:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-white border border-secondary-container rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                <option>Most Recent</option>
                <option>Most Popular</option>
                <option>Difficulty: Low to High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredPatterns.map((p, i) => (
              <Link key={i} href={`/pattern/${p.slug}?tab=finished-photo`} className="group">
                <div className="bg-white rounded-2xl p-3 border border-secondary-container shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative bg-surface-container">
                    <img className="w-full h-full object-cover" alt={p.title} src={p.img} />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                      <button className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                        <span className="material-symbols-outlined">visibility</span> Quick View
                      </button>
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-headline-md text-body-md text-on-surface truncate">
                        <span className="mr-1">{p.emoji}</span>{p.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${difficultyColor(p.difficulty)}`}>
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">{p.grid} • {p.colors} Colors</span>
                    </div>
                    <div className="flex items-center justify-between text-label-sm text-secondary">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">download</span> {p.downloads}
                      </span>
                      <span className="group-hover:text-primary transition-colors">View →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-10">
            <button className="p-2 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container font-bold">1</button>
            <button className="w-10 h-10 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container">2</button>
            <button className="w-10 h-10 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container">3</button>
            <span className="text-secondary">...</span>
            <button className="w-10 h-10 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container">12</button>
            <button className="p-2 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <section className="py-12 border-t border-surface-container-high">
        <div className="max-w-3xl">
          <h2 className="font-headline-md text-headline-md text-primary mb-4">About BeadPatternAI Search</h2>
          <p className="text-secondary font-body-md leading-relaxed">
            BeadPatternAI offers a curated library of high-quality Perler bead patterns optimized for real-world bead brands. Use the filters to narrow by difficulty, category, or grid size. Every pattern includes a printable PDF, color chart, and finished photo.
          </p>
        </div>
      </section>
    </div>
  );
}
