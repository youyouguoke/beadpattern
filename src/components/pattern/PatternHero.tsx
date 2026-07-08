"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface PatternHeroProps {
  pattern: Pattern;
}

export default function PatternHero({ pattern }: PatternHeroProps) {
  const category = pattern.categories?.[0];
  return (
    <div className="space-y-2">
      <nav className="text-secondary font-body-md text-sm">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/patterns" className="hover:text-primary">Patterns</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/category/${category.slug}`} className="hover:text-primary">{category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-primary">{pattern.title}</span>
      </nav>
      <h1 className="font-display-lg text-display-lg-mobile text-primary">{pattern.title}</h1>
      <p className="text-secondary font-body-lg">
        {pattern.description || `A kawaii Perler bead pattern featuring ${pattern.title.toLowerCase()}.`}
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        {pattern.tags?.map((tag) => (
          <Link
            key={tag.slug}
            href={`/search?q=${encodeURIComponent(tag.name)}`}
            className="text-xs px-3 py-1 rounded-full bg-surface-container text-secondary hover:bg-primary-container hover:text-white transition-colors"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
