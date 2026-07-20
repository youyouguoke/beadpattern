"use client";

import type { Pattern } from "@/types";
import { renderBeadGrid } from "@/lib/patternImage";

interface PatternGridProps {
  pattern: Pattern;
}

export default function PatternGrid({ pattern }: PatternGridProps) {
  const palette = (pattern.colorPalette || []).map((c) => c.hex);
  const grid = pattern.gridData
    ? renderBeadGrid(pattern.gridData, palette, {
        width: 560,
        height: 560,
        showGrid: true,
        gap: 1,
        beadRadius: 2,
      })
    : null;

  if (!grid) {
    return (
      <div className="bg-surface-container-lowest rounded-[24px] p-6 border border-outline-variant/20 text-center text-on-surface-variant">
        No grid data available.
      </div>
    );
  }

  const cols = pattern.gridData?.[0]?.length ?? 32;
  const rows = pattern.gridData?.length ?? 32;
  const colNumbers = Array.from({ length: cols }, (_, i) => i + 1);
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".slice(0, rows);

  return (
    <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/20 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-quicksand font-bold text-headline-md text-on-surface">Pattern Grid</h2>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-surface-container" title="Zoom In">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button className="p-2 rounded-lg bg-surface-variant text-on-surface-variant hover:bg-surface-container" title="Zoom Out">
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4">
        {/* Horizontal headers */}
        <div className="flex ml-8 mb-2">
          <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(18px, 1fr))`, width: "100%" }}>
            {colNumbers.map((n) => (
              <div key={n} className="text-[10px] text-center text-on-surface-variant font-mono">
                {n}
              </div>
            ))}
          </div>
        </div>

        <div className="flex">
          {/* Vertical headers */}
          <div className="flex flex-col w-8 mr-2">
            {rowLabels.split("").map((l, i) => (
              <div
                key={i}
                className="text-[10px] text-right pr-2 text-on-surface-variant font-mono flex items-center justify-end"
                style={{ height: `${560 / rows}px` }}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 border border-outline-variant p-1 bg-white">
            <div dangerouslySetInnerHTML={{ __html: grid.svg }} />
          </div>
        </div>
      </div>
    </div>
  );
}
