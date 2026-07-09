"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedPatterns, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";

export default function InspirationGallery() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [previews, setPreviews] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    getPublishedPatterns({ limit: 20 }).then((ps) => {
      setPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 320, height: 320, preferGrid: true });
      }
      setPreviews(map);
    });
  }, []);

  if (!patterns.length) return null;

  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low" id="gallery">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Inspiration Gallery</h2>
          <p className="text-secondary text-sm mt-1">Browse ideas from the community — Pinterest-style.</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="masonry-grid">
        {patterns.map((img) => (
          <Link
            key={img.slug}
            href={`/pattern/${img.slug}`}
            className="masonry-item bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group block"
          >
            <div className="overflow-hidden bg-secondary-container relative">
              {previews[img.slug]?.type === "svg" ? (
                <div className="w-full" dangerouslySetInnerHTML={{ __html: previews[img.slug]!.svg || "" }} />
              ) : previews[img.slug]?.type === "image" ? (
                <img className="w-full h-auto" alt={img.title} src={previews[img.slug]!.src} />
              ) : (
                <div className="w-full aspect-square bg-surface-container" />
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100 p-4">
                <span className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 pointer-events-none">
                  <span className="material-symbols-outlined">visibility</span> Quick View
                </span>
                <span className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 pointer-events-none">
                  <span className="material-symbols-outlined">file_download</span> Download PDF
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-headline-md text-body-md">{img.title}</h3>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">grid_4x4</span> {img.gridSize}
                </span>
                <span className="group-hover:text-primary transition-colors">View →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
