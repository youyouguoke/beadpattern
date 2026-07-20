"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedPatterns, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";

export default function InspirationGallery() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [previews, setPreviews] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    getPublishedPatterns({ limit: 24 }).then((ps) => {
      setPatterns(ps);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of ps) {
        map[p.slug] = getPatternImage(p, { width: 400, height: 600, preferFinished: true });
      }
      setPreviews(map);
    });
  }, []);

  if (!patterns.length) return null;

  const aspectClass = (index: number) => {
    const options = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[2/3]", "aspect-[5/6]"];
    return options[index % options.length];
  };

  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low" id="gallery">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="font-quicksand font-bold text-headline-lg text-primary">Inspiration Gallery</h2>
            <p className="text-on-surface-variant text-body-md mt-1">Pinterest-style Perler bead pattern ideas for your next project.</p>
          </div>
          <Link
            href="/patterns"
            className="inline-flex items-center gap-2 text-on-surface-variant font-label-sm hover:text-primary transition-colors"
          >
            Browse All Patterns
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="masonry-grid">
          {patterns.map((img, index) => (
            <Link
              key={img.slug}
              href={`/pattern/${img.slug}`}
              className="masonry-item bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 transition-all hover:-translate-y-1 hover:shadow-lg overflow-hidden group block"
            >
              <div className={`relative ${aspectClass(index)} overflow-hidden bg-surface-container-low`}>
                {previews[img.slug]?.type === "svg" ? (
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: previews[img.slug]!.svg || "" }} />
                ) : previews[img.slug]?.type === "image" ? (
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={img.title}
                    src={previews[img.slug]!.src}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-low" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100 p-4">
                  <span className="bg-white text-primary px-4 py-2 rounded-full font-label-sm flex items-center gap-2 pointer-events-none">
                    <span className="material-symbols-outlined">visibility</span> View Pattern
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-quicksand font-bold text-body-md text-on-surface mb-1 truncate">{img.title}</h3>
                <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">grid_4x4</span> {img.gridSize}
                  </span>
                  <span className="capitalize">{img.difficulty}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
