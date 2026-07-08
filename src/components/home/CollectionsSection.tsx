"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Collection, getCollections } from "@/lib/publicApiService";

const collectionColors: Record<string, string> = {
  halloween: "bg-orange-100 text-orange-900",
  christmas: "bg-green-100 text-green-900",
  animals: "bg-blue-100 text-blue-900",
  food: "bg-yellow-100 text-yellow-900",
  beginner: "bg-purple-100 text-purple-900",
};

const collectionEmojis: Record<string, string> = {
  halloween: "🎃",
  christmas: "🎄",
  animals: "🐾",
  food: "🍔",
  beginner: "🌱",
};

export default function CollectionsSection() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    getCollections().then(setCollections);
  }, []);

  if (!collections.length) return null;

  return (
    <section className="px-4 md:px-12 py-16 bg-surface">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Popular Collections</h2>
          <p className="text-secondary text-sm mt-1">Curated themes for every project</p>
        </div>
        <Link href="/collections" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((c) => (
          <Link key={c.slug} href={`/collection/${c.slug}`} className="group">
            <div className={`rounded-2xl ${collectionColors[c.slug] || "bg-surface-container text-on-surface"} p-6 transition-transform group-hover:scale-[1.02] h-full flex flex-col`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{collectionEmojis[c.slug] || "📁"}</span>
                <span className="text-xs font-bold opacity-90 bg-white/20 px-2 py-1 rounded-full">
                  {c.patternCount ?? c.count ?? 0} patterns
                </span>
              </div>
              <h3 className="font-headline-md text-body-lg mb-2">{c.title}</h3>
              <p className="text-sm opacity-90 mb-5 flex-grow">{c.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
                View Collection <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
