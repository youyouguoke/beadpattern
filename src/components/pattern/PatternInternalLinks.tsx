"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface PatternInternalLinksProps {
  pattern: Pattern;
}

export default function PatternInternalLinks({ pattern }: PatternInternalLinksProps) {
  const category = pattern.categories?.[0];
  const tags = pattern.tags?.slice(0, 6) || [];
  const collections = pattern.collections?.slice(0, 4) || [];
  const difficulty = pattern.difficulty;

  return (
    <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20">
      <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Explore More Patterns</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-quicksand font-bold text-body-lg text-on-surface">By Category</h3>
          <div className="flex flex-wrap gap-2">
            {category ? (
              <Link
                href={`/category/${category.slug}`}
                className="px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-label-sm font-bold hover:bg-primary hover:text-on-primary transition-colors"
              >
                {category.name}
              </Link>
            ) : (
              <span className="text-on-surface-variant">No category available.</span>
            )}
          </div>

          <h3 className="font-quicksand font-bold text-body-lg text-on-surface pt-2">By Difficulty</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/patterns?difficulty=${difficulty.toLowerCase()}`}
              className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-bold hover:bg-secondary hover:text-on-secondary transition-colors"
            >
              {difficulty} Patterns
            </Link>
            <Link
              href="/patterns"
              className="px-4 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-sm font-bold hover:bg-primary hover:text-on-primary transition-colors"
            >
              All Patterns
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-quicksand font-bold text-body-lg text-on-surface">By Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="px-4 py-2 rounded-full bg-surface-container text-on-surface-variant font-label-sm font-bold hover:bg-primary hover:text-on-primary transition-colors"
                >
                  {tag.name}
                </Link>
              ))
            ) : (
              <span className="text-on-surface-variant">No tags available.</span>
            )}
          </div>

          <h3 className="font-quicksand font-bold text-body-lg text-on-surface pt-2">In Collections</h3>
          <div className="flex flex-wrap gap-2">
            {collections.length > 0 ? (
              collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collection/${c.slug}`}
                  className="px-4 py-2 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm font-bold hover:bg-tertiary hover:text-on-tertiary transition-colors"
                >
                  {c.title}
                </Link>
              ))
            ) : (
              <span className="text-on-surface-variant">No collections available.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
