"use client";

import { useState } from "react";

const BEAD_SIZES = [
  { label: "5mm Perler / Hama Standard", mm: 5 },
  { label: "2.6mm Perler Mini / Artkal Mini", mm: 2.6 },
  { label: "10mm Perler Biggie", mm: 10 },
];

const BOARD_SIZES = [
  { label: "Small square (29x29 pegs)", pegs: 29 * 29 },
  { label: "Large square (58x58 pegs)", pegs: 58 * 58 },
  { label: "Large interlocking (2 boards = 58x116)", pegs: 58 * 116 },
];

export default function BeadCalculator() {
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [beadSize, setBeadSize] = useState(BEAD_SIZES[0].mm);
  const [board, setBoard] = useState(BOARD_SIZES[0].pegs);
  const [includeSpares, setIncludeSpares] = useState(true);

  const totalBeads = width * height;
  const spareBeads = includeSpares ? Math.ceil(totalBeads * 0.1) : 0;
  const beadsToBuy = totalBeads + spareBeads;
  const widthMm = width * beadSize;
  const heightMm = height * beadSize;
  const widthIn = widthMm / 25.4;
  const heightIn = heightMm / 25.4;
  const boardsNeeded = Math.ceil(totalBeads / board);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 space-y-6">
          <h3 className="font-quicksand font-bold text-headline-sm text-on-surface">Pattern Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-label-sm text-on-surface-variant">Width (beads)</span>
              <input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-label-sm text-on-surface-variant">Height (beads)</span>
              <input
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-label-sm text-on-surface-variant">Bead size</span>
            <select
              value={beadSize}
              onChange={(e) => setBeadSize(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
            >
              {BEAD_SIZES.map((b) => (
                <option key={b.mm} value={b.mm}>
                  {b.label} ({b.mm} mm)
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-label-sm text-on-surface-variant">Pegboard size</span>
            <select
              value={board}
              onChange={(e) => setBoard(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
            >
              {BOARD_SIZES.map((b) => (
                <option key={b.pegs} value={b.pegs}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSpares}
              onChange={(e) => setIncludeSpares(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-on-surface-variant">Add 10% spare beads</span>
          </label>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 space-y-6">
          <h3 className="font-quicksand font-bold text-headline-sm text-on-surface">Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-label-sm text-on-surface-variant">Total beads</p>
              <p className="font-quicksand font-bold text-display-sm text-primary">{totalBeads.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-label-sm text-on-surface-variant">Beads to buy</p>
              <p className="font-quicksand font-bold text-display-sm text-primary">{beadsToBuy.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-label-sm text-on-surface-variant">Finished size</p>
              <p className="font-quicksand font-bold text-headline-sm text-on-surface">
                {widthMm.toFixed(1)} × {heightMm.toFixed(1)} mm
              </p>
              <p className="text-sm text-on-surface-variant">
                {widthIn.toFixed(2)} × {heightIn.toFixed(2)} in
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <p className="text-label-sm text-on-surface-variant">Pegboards needed</p>
              <p className="font-quicksand font-bold text-display-sm text-primary">{boardsNeeded}</p>
            </div>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            Estimates include a small buffer. Actual bead counts vary by color blocking and design transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
