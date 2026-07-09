import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/lib/publicApiService";

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
  "christmas-perler-bead-patterns": "🎄",
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
  "christmas-perler-bead-patterns": "bg-green-100 text-green-900",
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

interface CollectionCardProps {
  collection: Collection;
  variant?: "default" | "page";
}

export default function CollectionCard({ collection, variant = "default" }: CollectionCardProps) {
  const emoji = collectionEmojis[collection.slug] || collection.emoji || "✨";
  const color = collectionColors[collection.slug] || "bg-surface-container text-on-surface";
  const count = collection.patternCount ?? collection.count ?? 0;

  if (variant === "page") {
    return (
      <Link
        href={`/collection/${collection.slug}`}
        className="group block bg-white rounded-2xl border border-secondary-container overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
      >
        {collection.banner ? (
          <div className="relative w-full h-40">
            <Image src={collection.banner} alt={collection.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
          </div>
        ) : (
          <div className={`w-full h-40 flex items-center justify-center text-6xl ${color}`}>
            {emoji}
          </div>
        )}
        <div className="p-5">
          <p className="text-label-sm text-on-surface-variant mb-2">{count} patterns</p>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{collection.title}</h3>
          <p className="text-body-md text-on-surface-variant line-clamp-2">
            {collection.description || `Explore the ${collection.title} collection.`}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/collection/${collection.slug}`} className="group">
      <div className={`rounded-2xl ${color} p-6 transition-transform group-hover:scale-[1.02] h-full flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <span className="text-4xl">{emoji}</span>
          <span className="text-xs font-bold opacity-90 bg-white/20 px-2 py-1 rounded-full">{count} patterns</span>
        </div>
        <h3 className="font-headline-md text-body-lg mb-2">{collection.title}</h3>
        <p className="text-sm opacity-90 mb-5 flex-grow">{collection.description}</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">
          View Collection
        </span>
      </div>
    </Link>
  );
}
