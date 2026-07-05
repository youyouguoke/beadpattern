"use client";

import Link from "next/link";

const POPULAR_SEARCHES = [
  { emoji: "🐸", label: "frog" },
  { emoji: "🐱", label: "cat" },
  { emoji: "👻", label: "ghost" },
  { emoji: "🎮", label: "pokemon" },
  { emoji: "🌸", label: "flower" },
  { emoji: "🍔", label: "food" },
  { emoji: "🎌", label: "anime" },
  { emoji: "💖", label: "kawaii" },
];

export default function HeroPopular() {
  return (
    <div className="max-w-7xl mx-auto mt-10 md:mt-14">
      <div className="flex flex-col items-center lg:items-start gap-2">
        <span className="text-sm text-secondary">Popular Searches</span>
        <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
          {POPULAR_SEARCHES.map((term) => (
            <Link
              key={term.label}
              href={`/search?q=${encodeURIComponent(term.label)}`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors"
            >
              <span className="text-base">{term.emoji}</span>
              {term.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
