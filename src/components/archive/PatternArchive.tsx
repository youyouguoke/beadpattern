"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";
import type { Pattern } from "@/types";
import { getPublishedPatterns, searchPatterns } from "@/lib/publicApiService";
import { getPatternImage } from "@/components/BeadRenderer";

function getPageNumbers(currentPage: number, totalPages: number, maxVisible = 7): (number | string)[] {
  if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

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
  categorySlug?: string;
}

export default function PatternArchive({ searchQuery = "", collectionSlug = "", categorySlug = "" }: PatternArchiveProps) {
  const searchParams = useSearchParams();
  const qParam = searchParams?.get("q") || "";
  const initialQuery = qParam || searchQuery;
  const [query, setQuery] = useState(initialQuery);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedDiffs, setSelectedDiffs] = useState<Record<string, boolean>>({ easy: true, medium: true, hard: false });
  const [sort, setSort] = useState("Most Recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const current = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") : null) || qParam || searchQuery;
    setQuery(current);
    setCurrentPage(1);
    let load: Promise<Pattern[]>;
    if (collectionSlug || categorySlug) {
      const targetSlug = collectionSlug || categorySlug;
      load = getPublishedPatterns({ [collectionSlug ? 'collection' : 'category']: targetSlug });
    } else {
      load = current.trim() ? searchPatterns({ q: current }).then((res) => res.patterns) : getPublishedPatterns({});
    }
    load.then((ps) => {
      setAllPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 240, height: 240, preferGrid: true });
      }
      setImages(map);
    }).catch((err) => {
      console.error("PatternArchive load failed:", err);
    });
  }, [qParam, searchQuery, collectionSlug, categorySlug]);


  const toggleDiff = (id: string) => {
    setSelectedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedPatterns = [...allPatterns].sort((a, b) => {
    switch (sort) {
      case "Most Recent": {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      case "Most Popular":
        return Number(b.downloads ?? b.estimatedBeads ?? 0) - Number(a.downloads ?? a.estimatedBeads ?? 0);
      case "Difficulty: Low to High": {
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        return diffOrder[a.difficulty.toLowerCase() as keyof typeof diffOrder] - diffOrder[b.difficulty.toLowerCase() as keyof typeof diffOrder];
      }
      default:
        return 0;
    }
  });

  const filteredPatterns = sortedPatterns.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = q === "" || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "All" || p.categories?.some((c) => c.name === selectedCategory) || p.tags?.some((t) => t.name === selectedCategory) || p.title.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSize = selectedSize === null || p.gridSize === selectedSize || p.grid === selectedSize;
    const matchesDiff = selectedDiffs[p.difficulty.toLowerCase()];
    return matchesQuery && matchesCategory && matchesSize && matchesDiff;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPatterns.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const paginatedPatterns = filteredPatterns.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center md:text-left">
        <div className="max-w-3xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">
            {query ? `Search Results for "${query}"` : "Browse Patterns"}
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
                  {categories.filter(Boolean).map((cat) => (
                    <button
                      key={`cat-${cat}`}
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
                      key={`size-${size}`}
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
            {paginatedPatterns.map((p) => (
              <Link key={p.slug} href={`/pattern/${p.slug}?tab=finished-photo`} className="group">
                <div className="bg-white rounded-2xl p-3 border border-secondary-container shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative bg-surface-container">
                    {images[p.slug]?.type === "svg" ? (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
                    ) : images[p.slug]?.type === "image" ? (
                      <img className="w-full h-full object-cover" alt={p.title} src={images[p.slug]!.src} />
                    ) : (
                      <div className="w-full h-full bg-surface-container" />
                    )}
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
                      <span className="text-[10px] text-on-surface-variant">{(p.gridSize ?? p.grid)} • {(p.colorCount ?? p.colors)} Colors</span>
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

          {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              className="p-2 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container disabled:opacity-40"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {getPageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="text-secondary">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                    currentPage === p
                      ? "bg-primary-container text-on-primary-container"
                      : "border border-secondary-container text-secondary hover:bg-surface-container"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="p-2 rounded-lg border border-secondary-container text-secondary hover:bg-surface-container disabled:opacity-40"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          )}
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
