"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublishedPatterns, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/components/BeadRenderer";

function diffColor(diff: string) {
  const normalized = diff?.toLowerCase();
  switch (normalized) {
    case "easy": return "bg-tertiary-container text-white";
    case "medium": return "bg-secondary-container text-on-secondary-container";
    case "hard": return "bg-error-container text-on-error-container";
  }
}

function difficultyLabel(diff: string) {
  return diff ? diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase() : "";
}

export default function DiscoverToday() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    getPublishedPatterns({ sort: "popular", limit: 8 }).then((ps) => {
      setPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 208, height: 208, preferGrid: true });
      }
      setImages(map);
    });
  }, []);

  if (!patterns.length) return null;

  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">🔥 Trending Today</h2>
          <p className="text-secondary text-sm mt-1">Latest patterns from our community</p>
        </div>
        <Link href="#trending" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      <div className="relative -mx-4 md:-mx-12">
        <div className="flex gap-4 overflow-x-auto px-4 md:px-12 pb-4 custom-scrollbar snap-x snap-mandatory">
          {patterns.map((p) => (
            <Link key={p.slug} href={`/pattern/${p.slug}?tab=finished-photo`} className="group flex-shrink-0 w-52 snap-start">
              <div className="bg-white rounded-xl bead-shadow overflow-hidden transition-all hover:-translate-y-1 h-full flex flex-col">
                <div className="aspect-square overflow-hidden bg-surface-container relative">
                  {images[p.slug]?.type === "svg" ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
                  ) : images[p.slug]?.type === "image" ? (
                    <img className="w-full h-full object-cover" alt={p.title} src={images[p.slug]!.src} />
                  ) : (
                    <div className="w-full h-full bg-surface-container" />
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${diffColor(p.difficulty)}`}>
                      {difficultyLabel(p.difficulty)}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                      <span className="material-symbols-outlined">visibility</span> Quick Preview
                    </span>
                    <span className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm flex items-center gap-2">
                      <span className="material-symbols-outlined">file_download</span> Download
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <p className="font-label-sm truncate">
                    <span className="mr-1">{p.emoji}</span>{p.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-secondary mt-2">
                    <span>{p.gridSize}</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">download</span> {p.downloads ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
