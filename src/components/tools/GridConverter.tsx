"use client";

import { useState } from "react";

const GRID_SIZES = [
  { label: "Perler / Hama Standard", width: 29, height: 29 },
  { label: "Perler / Hama Large", width: 58, height: 58 },
  { label: "Artkal Mini 2.6mm", width: 50, height: 50 },
  { label: "Perler Biggie", width: 18, height: 18 },
];

export default function GridConverter() {
  const [from, setFrom] = useState(GRID_SIZES[0]);
  const [to, setTo] = useState(GRID_SIZES[1]);
  const [beads, setBeads] = useState(1000);

  const ratio = (from.width * from.height) / (to.width * to.height);
  const toBeads = Math.round(beads * ratio);
  const toRows = Math.round(Math.sqrt(toBeads * (to.height / to.width)));
  const toCols = Math.round(toBeads / toRows) || 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 space-y-6">
          <h3 className="font-quicksand font-bold text-headline-sm text-on-surface">From</h3>
          <label className="space-y-2">
            <span className="text-label-sm text-on-surface-variant">Original grid</span>
            <select
              value={from.label}
              onChange={(e) => setFrom(GRID_SIZES.find((g) => g.label === e.target.value) || GRID_SIZES[0])}
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
            >
              {GRID_SIZES.map((g) => (
                <option key={g.label} value={g.label}>
                  {g.label} ({g.width} × {g.height})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-label-sm text-on-surface-variant">Original bead count</span>
            <input
              type="number"
              min={1}
              value={beads}
              onChange={(e) => setBeads(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
            />
          </label>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 space-y-6">
          <h3 className="font-quicksand font-bold text-headline-sm text-on-surface">To</h3>
          <label className="space-y-2">
            <span className="text-label-sm text-on-surface-variant">Target grid</span>
            <select
              value={to.label}
              onChange={(e) => setTo(GRID_SIZES.find((g) => g.label === e.target.value) || GRID_SIZES[0])}
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none"
            >
              {GRID_SIZES.map((g) => (
                <option key={g.label} value={g.label}>
                  {g.label} ({g.width} × {g.height})
                </option>
              ))}
            </select>
          </label>

          <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
            <p className="text-label-sm text-on-surface-variant">Equivalent beads</p>
            <p className="font-quicksand font-bold text-display-sm text-primary">{toBeads.toLocaleString()} beads</p>
            <p className="text-on-surface-variant">
              ≈ {toCols} × {toRows} on {to.label}
            </p>
          </div>
        </div>
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Conversions are based on peg density. Small bead sizes pack more detail per inch, so the finished physical size will differ.
      </p>
    </div>
  );
}
