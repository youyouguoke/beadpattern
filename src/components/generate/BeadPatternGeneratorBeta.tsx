"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPublishedPatterns, searchPatterns, Pattern } from "@/lib/publicApiService";
import { renderBeadGrid } from "@/lib/patternImage";

const paletteOptions = [
  { name: "Pastel Dream", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff"] },
  { name: "Candy Pop", colors: ["#ff6b81", "#ff8e72", "#ffd93d", "#6bcb77", "#4d96ff"] },
  { name: "Forest Mood", colors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"] },
  { name: "Kawaii Classic", colors: ["#ff9ff3", "#feca57", "#ff6b6b", "#48dbfb", "#1dd1a1"] },
  { name: "Retro Vapor", colors: ["#f368e0", "#00d2d3", "#5f27cd", "#ff9f43", "#10ac84"] },
];

const sizeOptions = ["24x24", "32x32", "48x48", "64x64"];

export default function BeadPatternGeneratorBeta() {
  const [prompt, setPrompt] = useState("cute frog drinking bubble tea");
  const [selectedSize, setSelectedSize] = useState("32x32");
  const [selectedPalette, setSelectedPalette] = useState(paletteOptions[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedPatterns, setMatchedPatterns] = useState<Pattern[]>([]);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "preview" | "empty">("empty");

  useEffect(() => {
    setPreviewSvg(null);
    setMode("empty");
    setMatchedPatterns([]);
  }, [prompt, selectedSize, selectedPalette]);

  const handleSearch = async () => {
    setIsSearching(true);
    setMode("search");
    try {
      const patterns = await searchPatterns({ q: prompt, limit: 8 }).then((res) => res.patterns);
      if (patterns.length > 0) {
        setMatchedPatterns(patterns);
        setPreviewSvg(null);
        setMode("search");
      } else {
        const preview = generatePreview(prompt, selectedSize, selectedPalette.colors);
        setPreviewSvg(preview);
        setMatchedPatterns([]);
        setMode("preview");
      }
    } finally {
      setIsSearching(false);
    }
  };

  function generatePreview(seed: string, size: string, palette: string[]): string {
    const [cols, rows] = size.split("x").map(Number);
    const normalized = seed.toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i);
      hash |= 0;
    }
    const rand = () => {
      hash = (hash * 1664525 + 1013904223) | 0;
      return (hash >>> 0) / 4294967296;
    };
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const radius = Math.min(cols, rows) / 2.5;
    const grid: (string | number)[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: (string | number)[] = [];
      for (let x = 0; x < cols; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) {
          row.push(-1);
        } else {
          const idx = Math.floor(rand() * palette.length);
          row.push(idx % palette.length);
        }
      }
      grid.push(row);
    }
    const { svg } = renderBeadGrid(grid, palette, { width: 400, height: 400, showGrid: true, gap: 1, beadRadius: 2 });
    return svg;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="p-4 bg-secondary-container/50 rounded-xl flex items-center gap-3 text-sm text-primary">
          <span className="material-symbols-outlined">info</span>
          Beta: We search existing patterns first, then preview a local AI draft.
        </div>

        <div>
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-2">
            Design Your Vision
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Describe your pattern. AI will search the library or draft a bead-by-bead preview.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Pattern Prompt</label>
            <textarea
              className="w-full h-28 p-4 rounded-xl bg-surface border-2 border-outline-variant focus:border-primary outline-none resize-none font-body-md"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., cute frog drinking bubble tea..."
            />
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Grid Size</label>
            <div className="grid grid-cols-4 gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl font-label-sm transition-colors ${
                    selectedSize === size
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Color Palette</label>
            <div className="grid grid-cols-5 gap-2">
              {paletteOptions.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => setSelectedPalette(palette)}
                  className={`h-12 rounded-xl border-2 transition-colors ${
                    selectedPalette.name === palette.name ? "border-primary" : "border-transparent hover:border-secondary-container"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${palette.colors.join(", ")})` }}
                  title={palette.name}
                />
              ))}
            </div>
            <p className="text-sm text-on-surface-variant">{selectedPalette.name}</p>
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching || !prompt.trim()}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline-md text-body-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60 transition-colors"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            {isSearching ? "Searching..." : "Search & Preview"}
          </button>

          <p className="text-center text-sm text-on-surface-variant">Free AI previews. Saving patterns requires sign-in.</p>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-outline-variant/20 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-quicksand font-bold text-headline-md text-on-surface">AI Preview</h2>
              <p className="text-on-surface-variant font-body-md">
                {selectedSize} &bull; {selectedPalette.name}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline flex items-center justify-center p-8 overflow-auto">
            {mode === "empty" && (
              <div className="text-center space-y-4 max-w-md">
                <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-5xl text-primary">auto_awesome</span>
                </div>
                <p className="text-on-surface font-headline-md">Ready to Create?</p>
                <p className="text-on-surface-variant font-body-md">
                  Enter a prompt and click Search & Preview. We&apos;ll match existing patterns or draft a local AI preview.
                </p>
              </div>
            )}

            {isSearching && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-primary font-label-sm">Searching the library...</p>
              </div>
            )}

            {mode === "search" && !isSearching && matchedPatterns.length > 0 && (
              <div className="w-full space-y-6">
                <p className="text-on-surface-variant font-body-md">
                  Found {matchedPatterns.length} matching patterns. Pick one or adjust your prompt.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedPatterns.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/pattern/${p.slug}`}
                      className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 hover:-translate-y-1 hover:border-primary/30 transition-all"
                    >
                      <p className="font-quicksand font-bold text-body-md text-on-surface">{p.title}</p>
                      <p className="text-on-surface-variant text-sm">{p.gridSize} &bull; {p.colorCount} colors</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {mode === "preview" && previewSvg && (
              <div className="w-full space-y-6 text-center">
                <div className="bg-surface p-6 rounded-2xl inline-block" dangerouslySetInnerHTML={{ __html: previewSvg }} />
                <p className="text-on-surface-variant font-body-md max-w-md mx-auto">
                  This is a local AI preview. Sign in to save, edit, and download a printable pattern.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
