"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const suggestions = [
  "frog", "frog flower", "frog christmas", "frog pixel art",
  "ghost", "ghost cute", "ghost halloween",
  "flower", "flower pot", "flower bouquet",
  "christmas", "christmas tree", "christmas penguin",
  "food", "food kawaii", "food sushi",
  "pokemon inspired", "pokemon pikachu", "pokemon eevee",
];

const trendingSearches = ["frog", "ghost", "flower", "christmas", "food", "pokemon inspired"];

interface HeroSearchProps {
  rotatingPlaceholders?: string[];
  placeholderIndex: number;
  value: string;
  onChange: (value: string) => void;
}

export default function HeroSearch({
  rotatingPlaceholders = ["Cute Frog", "Ghost", "Flower", "Pokemon", "Christmas"],
  placeholderIndex,
  value,
  onChange,
}: HeroSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filteredSuggestions = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 6)
    : [];

  const searchLink = `/search?q=${encodeURIComponent(value || rotatingPlaceholders[placeholderIndex])}`;

  return (
    <div ref={wrapRef} className="relative w-full max-w-lg mx-auto lg:mx-0">
      <div className="w-full bg-white rounded-2xl p-2 bead-shadow border-2 border-secondary-container flex flex-col md:flex-row gap-2 items-center">
        <div className="flex-1 flex items-center px-3 md:px-4 w-full h-12 md:h-13">
          <span className="material-symbols-outlined text-primary mr-2">search</span>
          <input
            ref={inputRef}
            className="w-full border-none focus:ring-0 text-base placeholder:text-outline italic bg-transparent outline-none"
            placeholder={`Try "${rotatingPlaceholders[placeholderIndex]}"`}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                window.location.href = searchLink;
              }
            }}
          />
        </div>
        <Link
          href={searchLink}
          className="w-full md:w-auto shrink-0 bg-primary-container text-white px-6 py-3 rounded-xl font-headline-md text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
        >
          Browse Patterns
        </Link>
      </div>

      {showSuggestions && (value.trim() || filteredSuggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-secondary-container shadow-xl p-2 z-30">
          {value.trim() ? (
            <>
              <p className="px-3 py-2 text-xs text-secondary uppercase tracking-wide">Suggestions</p>
              {filteredSuggestions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-secondary">No matches. Try AI generate.</p>
              ) : (
                filteredSuggestions.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container text-sm text-on-surface"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <span className="material-symbols-outlined text-secondary">search</span>
                    {s}
                  </Link>
                ))
              )}
            </>
          ) : null}

          <p className="px-3 py-2 text-xs text-secondary uppercase tracking-wide">Trending Searches</p>
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {rotatingPlaceholders.map((p) => (
              <Link
                key={p}
                href={`/search?q=${encodeURIComponent(p)}`}
                className="text-sm px-3 py-1.5 rounded-full bg-surface-container text-secondary hover:bg-primary-container hover:text-white transition-colors"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
