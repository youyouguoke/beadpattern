"use client";

import type { Pattern } from "@/types";
import SaveButton from "./SaveButton";
import { renderBeadGrid } from "@/components/BeadRenderer";

interface PatternSidebarProps {
  pattern: Pattern;
  onDownloadPDF: () => void;
  onDownloadPNG: () => void;
}

export default function PatternSidebar({
  pattern,
  onDownloadPDF,
  onDownloadPNG,
}: PatternSidebarProps) {
  const paletteHex: string[] = (pattern.colorPalette || []).map((c) => c.hex);

  const patternGrid = pattern.gridData
    ? renderBeadGrid(pattern.gridData, paletteHex, {
        width: 560,
        height: 560,
        showGrid: true,
        gap: 1,
        beadRadius: 2,
      })
    : null;

  const palette = pattern.colorPalette || [];
  const beads = pattern.estimatedBeads ?? pattern.beadCount ?? 0;
  const gridSize = pattern.gridSize ?? pattern.grid ?? "-";
  const colorCount = pattern.colorCount ?? palette.length ?? 0;

  return (
    <aside className="lg:col-span-4 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-secondary-container space-y-4 sticky top-24">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{pattern.emoji}</span>
          <div>
            <p className="font-headline-md text-body-md">{pattern.title}</p>
            <p className="text-secondary text-sm">
              {pattern.difficulty} &bull; {gridSize}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container rounded-xl p-3 text-center">
            <p className="text-secondary text-[10px] uppercase tracking-wide">Grid Size</p>
            <p className="font-semibold text-on-surface text-sm">{gridSize}</p>
          </div>
          <div className="bg-surface-container rounded-xl p-3 text-center">
            <p className="text-secondary text-[10px] uppercase tracking-wide">Difficulty</p>
            <p className="font-semibold text-on-surface text-sm">{pattern.difficulty}</p>
          </div>
          <div className="bg-surface-container rounded-xl p-3 text-center">
            <p className="text-secondary text-[10px] uppercase tracking-wide">Beads</p>
            <p className="font-semibold text-on-surface text-sm">{beads.toLocaleString()}</p>
          </div>
          <div className="bg-surface-container rounded-xl p-3 text-center">
            <p className="text-secondary text-[10px] uppercase tracking-wide">Colors</p>
            <p className="font-semibold text-on-surface text-sm">{colorCount}</p>
          </div>
        </div>

        <div>
          <p className="font-label-sm text-on-surface mb-2">Palette ({colorCount} Colors)</p>
          <div className="flex flex-wrap gap-2">
            {palette.map((c) => (
              <div
                key={c.hex}
                className="w-8 h-8 rounded-lg border border-white shadow-sm"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-secondary-container space-y-3">
          <SaveButton patternSlug={pattern.slug} />
          <button
            onClick={onDownloadPDF}
            className="w-full bg-primary text-white py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">file_download</span> Download PDF
          </button>
          <button
            onClick={onDownloadPNG}
            className="w-full bg-primary-fixed text-on-primary-fixed py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined">download</span> Download PNG
          </button>
        </div>
      </div>

      <div
        data-print-root
        className="bg-white p-8 w-[800px]"
        style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">{pattern.title}</h1>
          <p className="text-secondary">
            {pattern.difficulty} &bull; {gridSize} &bull; {beads.toLocaleString()} beads
          </p>
        </div>
        <div className="flex justify-center mb-6">
          {patternGrid ? (
            <div dangerouslySetInnerHTML={{ __html: patternGrid.svg }} />
          ) : (
            <img src={pattern.finishedImage || pattern.coverImage} alt={pattern.title} className="max-w-md rounded-xl" crossOrigin="anonymous" />
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Color Chart</h2>
          <div className="grid grid-cols-2 gap-3">
            {palette.map((c, i) => (
              <div key={c.hex + i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: c.hex }} />
                <div className="text-sm">
                  <p className="font-semibold">{c.name || `Color ${i + 1}`}</p>
                  <p className="text-secondary">{c.code || c.hex} &bull; {c.count} beads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-3">Step-by-Step Guide</h2>
          <ol className="list-decimal list-inside space-y-2">
            {pattern.steps?.map((step, i) => (
              <li key={i} className="text-secondary">{step.description}</li>
            ))}
          </ol>
        </div>
        <div className="mt-8 text-center text-xs text-secondary">
          Generated by BeadPatternAI &bull; beadpatternai.com
        </div>
      </div>
    </aside>
  );
}
