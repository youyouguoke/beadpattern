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
  "animal-perler-bead-patterns": "bg-blue-100 text-blue-900",
  "cute-animals": "bg-pink-100 text-pink-900",
  "easy-perler-bead-patterns": "bg-green-100 text-green-900",
  "pocket-pets": "bg-orange-100 text-orange-900",
  "kawaii-perler-bead-patterns": "bg-pink-100 text-pink-900",
  "farm-friends": "bg-amber-100 text-amber-900",
  "cat-perler-bead-patterns": "bg-purple-100 text-purple-900",
  "ocean-life": "bg-cyan-100 text-cyan-900",
  "panda-perler-bead-patterns": "bg-stone-100 text-stone-900",
  safari: "bg-yellow-100 text-yellow-900",
  "baby-animals": "bg-rose-100 text-rose-900",
  "halloween-perler-bead-patterns": "bg-orange-100 text-orange-900",
  "pixel-art-perler-bead-patterns": "bg-indigo-100 text-indigo-900",
  "flower-perler-bead-patterns": "bg-pink-100 text-pink-900",
  "gaming-perler-bead-patterns": "bg-violet-100 text-violet-900",
  "food-drink-perler-bead-patterns": "bg-amber-100 text-amber-900",
  "character-perler-bead-patterns": "bg-sky-100 text-sky-900",
  "nature-perler-bead-patterns": "bg-emerald-100 text-emerald-900",
  "fantasy-mythical-perler-bead-patterns": "bg-fuchsia-100 text-fuchsia-900",
  "heart-perler-bead-patterns": "bg-red-100 text-red-900",
  "insect-perler-bead-patterns": "bg-lime-100 text-lime-900",
  "medium-perler-bead-patterns": "bg-teal-100 text-teal-900",
  "retro-perler-bead-patterns": "bg-orange-100 text-orange-900",
  "rainbow-perler-bead-patterns": "bg-rose-100 text-rose-900",
  birthday: "bg-pink-100 text-pink-900",
  "seasonal-holiday-perler-bead-patterns": "bg-red-100 text-red-900",
  "charm-collection": "bg-purple-100 text-purple-900",
};

const collectionEmojis: Record<string, string> = {
  halloween: "🎃",
  christmas: "🎄",
  animals: "🐾",
  food: "🍔",
  beginner: "🌱",
  "animal-perler-bead-patterns": "🐾",
  "cute-animals": "🐰",
  "easy-perler-bead-patterns": "🌱",
  "pocket-pets": "🐹",
  "kawaii-perler-bead-patterns": "🎀",
  "farm-friends": "🐄",
  "cat-perler-bead-patterns": "🐱",
  "ocean-life": "🐠",
  "panda-perler-bead-patterns": "🐼",
  safari: "🦁",
  "baby-animals": "🐣",
  "halloween-perler-bead-patterns": "🎃",
  "pixel-art-perler-bead-patterns": "👾",
  "flower-perler-bead-patterns": "🌸",
  "gaming-perler-bead-patterns": "🎮",
  "food-drink-perler-bead-patterns": "🍩",
  "character-perler-bead-patterns": "🦸",
  "nature-perler-bead-patterns": "🌿",
  "fantasy-mythical-perler-bead-patterns": "🦄",
  "heart-perler-bead-patterns": "❤️",
  "insect-perler-bead-patterns": "🐝",
  "medium-perler-bead-patterns": "⭐",
  "retro-perler-bead-patterns": "📻",
  "rainbow-perler-bead-patterns": "🌈",
  birthday: "🎂",
  "seasonal-holiday-perler-bead-patterns": "🎉",
  "charm-collection": "✨",
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
