"use client";

import { useState } from "react";
import { Pattern } from "@/lib/patternService";
import BeadRenderer, { renderBeadGrid } from "@/components/BeadRenderer";

interface PatternGalleryProps {
  pattern: Pattern;
  finishedImage: { type: "image" | "svg"; src: string; svg?: string } | null;
  onTabChange?: (tab: string) => void;
  defaultTab?: string;
}

const TABS = ["Finished Photo", "Pattern", "Color Chart", "Guide"];

export default function PatternGallery({
  pattern,
  finishedImage,
  onTabChange,
  defaultTab = "Finished Photo",
}: PatternGalleryProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTab = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const patternGrid = pattern.gridData
    ? renderBeadGrid(pattern.gridData, pattern.colorPalette, {
        width: 560,
        height: 560,
        showGrid: true,
        gap: 1,
        beadRadius: 2,
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
      <div className="flex border-b border-secondary-container">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTab(tab)}
            className={`flex-1 py-3 font-label-sm transition-colors ${
              activeTab === tab
                ? "bg-primary-container text-white"
                : "text-secondary hover:bg-surface-container"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-10">
        {activeTab === "Pattern" && (
          <div className="flex justify-center">
            <div className="bg-surface-container p-4 rounded-xl inline-block">
              {patternGrid ? (
                <div dangerouslySetInnerHTML={{ __html: patternGrid.svg }} />
              ) : (
                <BeadRenderer
                  grid={undefined}
                  palette={pattern.colorPalette}
                  width={400}
                  height={400}
                  title={pattern.title}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "Color Chart" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pattern.palette.map((c, i) => (
              <div
                key={c.hex + i}
                className="flex items-center gap-4 p-3 bg-surface-container rounded-lg"
              >
                <div
                  className="w-12 h-12 rounded-lg border border-secondary"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="flex-1">
                  <p className="font-label-sm">{c.name || `Color ${i + 1}`}</p>
                  <p className="text-secondary text-sm">
                    Code: {c.code || c.hex} • {c.count} beads
                  </p>
                </div>
                <span className="font-mono text-sm text-secondary">{c.hex}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Finished Photo" && (
          <div className="text-center">
            {finishedImage?.type === "image" ? (
              <img
                data-print-finished
                className="w-full max-w-lg mx-auto rounded-xl"
                alt={`Finished perler bead ${pattern.title}`}
                src={pattern.finished}
              />
            ) : (
              <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: finishedImage?.svg || "" }} />
              </div>
            )}
            <p className="mt-4 text-secondary">
              Example finished project using the bead template above.
            </p>
          </div>
        )}

        {activeTab === "Guide" && (
          <ol className="space-y-3 list-decimal list-inside">
            {pattern.steps.map((step, i) => (
              <li key={i} className="font-body-md text-secondary">
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
