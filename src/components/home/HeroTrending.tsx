"use client";

import Link from "next/link";

const TRENDING_TERMS = [
  { emoji: "🐸", label: "frog" },
  { emoji: "👻", label: "ghost" },
  { emoji: "🌸", label: "flower" },
  { emoji: "🎄", label: "christmas" },
  { emoji: "🍔", label: "food" },
  { emoji: "🎮", label: "pokemon inspired" },
];

interface HeroTrendingProps {
  title?: string;
  variant?: "inline" | "bottom";
}

export default function HeroTrending({ title = "Trending Searches", variant = "inline" }: HeroTrendingProps) {
  return (
    <div className={`space-y-2 ${variant === "bottom" ? "w-full" : ""}`}>
      <p className="text-sm text-secondary text-center lg:text-left">{title}</p>
      <div className={`flex flex-wrap gap-2 ${variant === "bottom" ? "justify-center lg:justify-start" : "justify-center lg:justify-start"}`}>
        {TRENDING_TERMS.map((t) => (
          <Link
            key={t.label}
            href={`/search?q=${encodeURIComponent(t.label)}`}
            className="text-sm px-3 py-1.5 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors"
          >
            {t.emoji} {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
