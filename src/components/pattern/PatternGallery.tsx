"use client";

import type { Pattern } from "@/types";

interface PatternGalleryProps {
  pattern: Pattern;
  finishedImage: { type: "image" | "svg"; src: string; svg?: string } | null;
}

export default function PatternGallery({ pattern, finishedImage }: PatternGalleryProps) {
  const src = finishedImage?.type === "image"
    ? finishedImage.src || pattern.finishedImage || pattern.coverImage
    : pattern.finishedImage || pattern.coverImage;

  return (
    <div className="rounded-[24px] overflow-hidden shadow-2xl relative group bg-surface-container-low">
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full font-label-sm shadow-sm">
          Featured Design
        </span>
      </div>

      {finishedImage?.type === "svg" ? (
        <div
          className="w-full h-full min-h-[400px] md:min-h-[560px] flex items-center justify-center p-6"
          dangerouslySetInnerHTML={{ __html: finishedImage.svg || "" }}
        />
      ) : (
        <img
          data-print-finished
          className="w-full h-full min-h-[400px] md:min-h-[560px] object-cover transition-transform duration-700 group-hover:scale-105"
          alt={`Finished perler bead ${pattern.title}`}
          src={src}
        />
      )}
    </div>
  );
}
