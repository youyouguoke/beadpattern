"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublishedPatterns, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";

function difficultyColor(diff: string) {
  const normalized = diff?.toLowerCase();
  switch (normalized) {
    case "easy": return "bg-tertiary-container text-white";
    case "medium": return "bg-secondary-container text-on-secondary-container";
    case "hard": return "bg-error-container text-on-error-container";
    default: return "bg-surface-variant text-on-surface-variant";
  }
}

function difficultyLabel(diff: string) {
  return diff ? diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase() : "";
}

export default function TrendingPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    getPublishedPatterns({ sort: "popular", limit: 8 }).then((ps) => {
      setPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 240, height: 240, preferGrid: true });
      }
      setImages(map);
    });
  }, []);

  if (!patterns.length) return null;

  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="trending">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Trending Today</h2>
          <p className="text-secondary text-sm mt-1">Most downloaded this week</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
        {patterns.map((p, i) => (
          <div
            key={p.slug}
            className="snap-start shrink-0 w-[240px] md:w-[280px] bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="aspect-square overflow-hidden bg-secondary-container relative">
              {images[p.slug]?.type === "svg" ? (
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
              ) : images[p.slug]?.type === "image" ? (
                <img className="w-full h-full object-cover" alt={p.title} src={images[p.slug]!.src} />
              ) : (
                <div className="w-full h-full bg-surface-container" />
              )}
              {hovered === i && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity">
                  <button className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                    <span className="material-symbols-outlined">visibility</span> Quick Preview
                  </button>
                  <Link
                    href={`/pattern/${p.slug}?tab=finished-photo`}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined">file_download</span> Download
                  </Link>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="mb-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${difficultyColor(p.difficulty)}`}>{difficultyLabel(p.difficulty)}</span>
              </div>
              <h3 className="font-headline-md text-body-md mb-1">{p.title}</h3>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wide">
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{p.gridSize}</span>
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant">{p.colorCount} Colors</span>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">download</span> {p.downloads ?? 0}
                </span>
                <Link href={`/pattern/${p.slug}`} className="group-hover:text-primary transition-colors">View →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
