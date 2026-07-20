"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Pattern } from "@/types";
import { getCategories, getPublishedPatterns, searchPatterns } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";
import type { Category } from "@/types";
import SearchSuggestions from "./SearchSuggestions";

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
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const sizes = ["16x16", "24x24", "32x32", "48x48", "64x64"];

const sortOptions = [
  { id: "newest", label: "Most Recent" },
  { id: "popular", label: "Most Popular" },
  { id: "difficulty", label: "Difficulty: Low to High" },
];

function difficultyBadge(diff: string) {
  switch (diff.toLowerCase()) {
    case "easy": return "bg-secondary text-on-secondary";
    case "medium": return "bg-tertiary-container text-on-tertiary-container";
    case "hard": return "bg-error text-on-error";
    default: return "bg-surface-container text-on-surface-variant";
  }
}

interface PatternArchiveProps {
  searchQuery?: string;
  collectionSlug?: string;
  categorySlug?: string;
}

const popularSearches = [
  "Cat Perler Bead Patterns",
  "Easy Perler Beads",
  "Kawaii Pixel Art",
  "Halloween Patterns",
  "Christmas Patterns",
  "Free Printable Grids",
];

export default function PatternArchive({ searchQuery = "", collectionSlug = "", categorySlug = "" }: PatternArchiveProps) {
  const searchParams = useSearchParams();
  const qParam = searchParams?.get("q") || "";
  const initialQuery = qParam || searchQuery;

  const [query, setQuery] = useState(initialQuery);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedDiffs, setSelectedDiffs] = useState<Record<string, boolean>>({ easy: true, medium: true, hard: true });
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemsPerPage = 12;

  // Sync local query with URL/props without setState in effect
  const effectiveQuery = qParam || searchQuery;
  if (query !== effectiveQuery) {
    setQuery(effectiveQuery);
    setCurrentPage(1);
  }

  useEffect(() => {
    let load: Promise<Pattern[]>;
    if (collectionSlug || categorySlug) {
      const targetSlug = collectionSlug || categorySlug;
      load = getPublishedPatterns({ [collectionSlug ? "collection" : "category"]: targetSlug });
    } else {
      load = query.trim() ? searchPatterns({ q: query }).then((res) => res.patterns) : getPublishedPatterns({});
    }
    load
      .then((ps) => {
        setAllPatterns(ps);
        const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
        for (const p of ps) {
          map[p.slug] = getPatternImage(p, { width: 320, height: 320, preferGrid: true });
        }
        setImages(map);
      })
      .catch((err) => {
        console.error("PatternArchive load failed:", err);
      });
  }, [query, collectionSlug, categorySlug]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const toggleDiff = (id: string) => {
    setSelectedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSize(null);
    setSelectedDiffs({ easy: true, medium: true, hard: true });
    setQuery("");
    setShowSuggestions(false);
  };

  const filteredPatterns = useMemo(() => {
    const q = query.toLowerCase();
    let result = allPatterns.filter((p) => {
      const matchesQuery = q === "" || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.seoKeywords?.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === null || p.categories?.some((c) => c.slug === selectedCategory || c.name === selectedCategory) || p.tags?.some((t) => t.slug === selectedCategory);
      const matchesSize = selectedSize === null || p.gridSize === selectedSize || p.grid === selectedSize;
      const matchesDiff = selectedDiffs[p.difficulty.toLowerCase()] ?? true;
      return matchesQuery && matchesCategory && matchesSize && matchesDiff;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "popular":
          return Number(b.downloads ?? 0) - Number(a.downloads ?? 0);
        case "difficulty": {
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return (diffOrder[a.difficulty.toLowerCase() as keyof typeof diffOrder] || 99) - (diffOrder[b.difficulty.toLowerCase() as keyof typeof diffOrder] || 99);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [allPatterns, query, selectedCategory, selectedSize, selectedDiffs, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredPatterns.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const paginatedPatterns = filteredPatterns.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center md:text-left">
        <div className="max-w-3xl relative">
          <h1 className="font-quicksand text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
            {query ? `Search: "${query}"` : "Browse Patterns"}
          </h1>
          <p className="font-plus-jakarta text-body-lg text-on-surface-variant mb-8 leading-relaxed">
            Search thousands of printable Perler bead patterns by keyword, category, or grid size. Not found? Create one with AI.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
              }
            }}
            className="flex w-full max-w-xl bg-surface-container-lowest rounded-full p-1.5 border border-outline-variant shadow-sm relative"
          >
            <div className="flex-1 flex items-center px-4">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">sparkle</span>
              <input
                className="flex-1 bg-transparent outline-none text-body-md placeholder:text-on-surface-variant"
                placeholder="Search patterns, e.g. frog, ghost..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
            </div>
            <button type="submit" className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors">
              Search
            </button>
          </form>
          {showSuggestions && <SearchSuggestions query={query} onSelect={(q) => {
            setQuery(q);
            window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }} />}
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-quicksand font-bold text-headline-sm text-on-surface">Filters</h3>
                <button
                  className="text-label-sm text-primary hover:text-primary-container"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Difficulty</p>
                <div className="space-y-2">
                  {difficulties.map((d) => (
                    <label key={d.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedDiffs[d.id]}
                        onChange={() => toggleDiff(d.id)}
                        className="w-5 h-5 rounded border-2 border-outline-variant text-primary focus:ring-primary"
                      />
                      <span className="text-body-md text-on-surface group-hover:text-primary transition-colors">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Categories</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${
                      selectedCategory === null
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Grid Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`px-3 py-1.5 rounded-lg text-label-sm transition-colors ${
                        selectedSize === size
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
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
            <span className="text-body-md text-on-surface-variant">{filteredPatterns.length} patterns found</span>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary"
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {paginatedPatterns.map((p) => (
              <Link key={p.slug} href={`/pattern/${p.slug}`} className="pattern-card group bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/20">
                <div className="aspect-square overflow-hidden bg-surface-container-low relative">
                  {images[p.slug]?.type === "svg" ? (
                    <div className="w-full h-full p-4" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
                  ) : images[p.slug]?.type === "image" ? (
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} src={images[p.slug]!.src} />
                  ) : (
                    <div className="w-full h-full bg-surface-container" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${difficultyBadge(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-label-sm">
                      {p.gridSize || p.grid}
                    </span>
                  </div>
                  <h4 className="font-quicksand font-bold text-body-md text-on-surface mb-1 truncate group-hover:text-primary transition-colors">
                    {p.emoji ? `${p.emoji} ` : ""}
                    {p.title}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant mb-3">
                    {(p.colorCount ?? p.colors)} colors · {(p.estimatedBeads ?? p.beadCount)} beads
                  </p>
                  <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">file_download</span> {p.downloads ?? 0}
                    </span>
                    <span className="group-hover:text-primary transition-colors">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="text-on-surface-variant">... </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-10 h-10 rounded-xl font-bold transition-colors ${
                      currentPage === p
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
          {filteredPatterns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
              <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
              </div>
              <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-2">No patterns found</h2>
              <p className="text-on-surface-variant font-body-md max-w-md mb-6">
                Try a different keyword, adjust your filters, or browse popular searches below.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                {popularSearches.map((term) => (
                  <a
                    key={term}
                    href={`/patterns?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors font-label-md"
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="py-12 border-t border-outline-variant/30">
        <div className="max-w-3xl">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">About BeadPatternAI Search</h2>
          <p className="text-on-surface-variant font-body-md leading-relaxed">
            BeadPatternAI offers a curated library of high-quality Perler bead patterns optimized for real-world bead brands. Use the filters to narrow by difficulty, category, or grid size. Every pattern includes a printable PDF, color chart, and finished photo.
          </p>
        </div>
      </section>
    </div>
  );
}
