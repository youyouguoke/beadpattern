"use client";

import { useState } from "react";

const suggestions = ["frog", "ghost", "cat", "christmas tree", "pumpkin", "strawberry bear"];

export default function GlobalSearch() {
  const [query, setQuery] = useState("");

  return (
    <section className="px-4 md:px-12 py-8 bg-surface-container-low" id="search">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 5,000+ patterns..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-secondary-container text-body-md focus:border-primary outline-none bead-shadow"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          <span className="text-label-sm text-secondary">Popular:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-label-sm px-3 py-1 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
