"use client";

import type { Pattern } from "@/types";

interface PatternColorKeyProps {
  pattern: Pattern;
}

export default function PatternColorKey({ pattern }: PatternColorKeyProps) {
  const palette = pattern.colorPalette || [];

  return (
    <div className="bg-surface-container-low rounded-[24px] p-6 shadow-sm border border-outline-variant/20">
      <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Color Key</h2>
      <ul className="space-y-4">
        {palette.map((c, i) => (
          <li key={c.hex + i} className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full shadow-inner border border-outline-variant"
              style={{ backgroundColor: c.hex }}
            />
            <div className="flex-1">
              <span className="block font-bold text-on-surface">{c.name || `Color ${i + 1}`}</span>
              <span className="text-label-sm text-on-surface-variant uppercase">
                {c.code || c.hex} • Perler
              </span>
            </div>
            <span className="font-mono text-body-md font-bold">{c.count}</span>
          </li>
        ))}
      </ul>

      <button className="w-full mt-6 py-3 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-xl font-label-md hover:border-primary hover:text-primary transition-colors">
        + Add Custom Color
      </button>
    </div>
  );
}
