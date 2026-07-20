"use client";

import Link from "next/link";
import type { Pattern } from "@/types";
import SaveButton from "./SaveButton";

interface PatternInfoCardProps {
  pattern: Pattern;
  onDownloadPDF: () => void;
  onDownloadPNG: () => void;
  selectedSize?: number;
  onSelectSize?: (size: number) => void;
}

const SIZES = [
  { label: "Original", scale: 1 },
  { label: "2×", scale: 2 },
  { label: "3×", scale: 3 },
];

export default function PatternInfoCard({ pattern, onDownloadPDF, onDownloadPNG, selectedSize = 1, onSelectSize }: PatternInfoCardProps) {
  const palette = pattern.colorPalette || [];
  const beads = pattern.estimatedBeads ?? pattern.beadCount ?? 0;
  const gridSize = pattern.gridSize ?? pattern.grid ?? "-";
  const colorCount = pattern.colorCount ?? palette.length ?? 0;
  const category = pattern.categories?.[0];

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 md:p-8 sticky top-24 space-y-6">
      <nav className="text-body-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/patterns" className="hover:text-primary transition-colors">Patterns</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/category/${category.slug}`} className="hover:text-primary transition-colors">{category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-on-surface">{pattern.title}</span>
      </nav>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="font-quicksand font-bold text-headline-xl text-on-surface">{pattern.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-label-sm font-bold border border-outline-variant ${
              pattern.difficulty.toLowerCase() === "easy"
                ? "bg-secondary text-on-secondary"
                : pattern.difficulty.toLowerCase() === "medium"
                ? "bg-tertiary-container text-on-tertiary-container"
                : "bg-error text-on-error"
            }`}
          >
            {pattern.difficulty.toUpperCase()}
          </span>
        </div>
        <p className="text-on-surface-variant font-plus-jakarta text-body-lg max-w-md">
          {pattern.description || `A ${pattern.difficulty} Perler bead pattern featuring ${pattern.title.toLowerCase()}.`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 py-6 border-y border-outline-variant">
        <div className="text-center">
          <span className="block text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">Size</span>
          <span className="text-on-surface font-bold text-body-lg">{gridSize}</span>
        </div>
        <div className="text-center border-x border-outline-variant">
          <span className="block text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">Colors</span>
          <span className="text-on-surface font-bold text-body-lg">{colorCount} Shades</span>
        </div>
        <div className="text-center">
          <span className="block text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">Time</span>
          <span className="text-on-surface font-bold text-body-lg">{pattern.estimatedTime || "30 min"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={onDownloadPDF}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-md font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">download</span> Download PDF
        </button>
        <button
          onClick={onDownloadPNG}
          className="bg-surface border-2 border-primary text-primary px-6 py-3 rounded-full font-label-md font-bold flex items-center gap-2 hover:bg-primary-fixed transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">print</span> Print
        </button>
        <SaveButton patternSlug={pattern.slug} variant="icon" />
      </div>

      <div className="space-y-3 pt-2">
        <p className="font-label-sm text-on-surface">Print Size</p>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((s) => {
            const active = selectedSize === s.scale;
            return (
              <button
                key={s.label}
                onClick={() => onSelectSize?.(s.scale)}
                className={`py-2 rounded-xl text-label-sm font-bold transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-primary hover:text-on-primary"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-label-sm text-on-surface">Palette ({colorCount} colors)</p>
        <div className="flex flex-wrap gap-2">
          {palette.map((c) => (
            <div
              key={c.hex}
              className="w-8 h-8 rounded-lg border border-outline-variant shadow-sm"
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
