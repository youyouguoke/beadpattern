"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublishedPatterns, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";

function difficultyBadge(diff: string) {
  const normalized = diff?.toLowerCase();
  switch (normalized) {
    case "easy": return "bg-secondary text-on-secondary";
    case "medium": return "bg-tertiary-container text-on-tertiary-container";
    case "hard": return "bg-error text-on-error";
    default: return "bg-surface-container text-on-surface-variant";
  }
}

function difficultyLabel(diff: string) {
  return diff ? diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase() : "";
}

export default function NewPatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    getPublishedPatterns({ sort: "newest", limit: 8 }).then((ps) => {
      setPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 320, height: 320, preferGrid: true });
      }
      setImages(map);
    });
  }, []);

  if (!patterns.length) return null;

  return (
    <section className="bg-surface-container-low py-16 md:py-24" id="new">
      <div className="container-main">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title text-primary">New Patterns</h2>
            <p className="section-subtitle mt-2">Fresh designs added this week</p>
          </div>
          <Link href="/patterns?sort=newest" className="text-label-md text-on-surface-variant hover:text-primary flex items-center gap-1">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {patterns.map((p) => (
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
                    {difficultyLabel(p.difficulty)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-label-sm">
                    {p.gridSize}
                  </span>
                </div>
                <h3 className="font-quicksand font-bold text-body-md text-on-surface group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">{p.colorCount} colors · {p.estimatedBeads} beads · {p.estimatedTime}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
