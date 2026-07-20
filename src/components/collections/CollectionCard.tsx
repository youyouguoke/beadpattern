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
  halloween: "bg-tertiary-container",
  christmas: "bg-secondary-container",
  animals: "bg-primary-container",
  food: "bg-tertiary-fixed",
  beginner: "bg-primary-fixed",
  "animal-perler-bead-patterns": "bg-primary-container",
  "cute-animals": "bg-primary-fixed",
  "easy-perler-bead-patterns": "bg-secondary-container",
  "pocket-pets": "bg-tertiary-fixed",
  "kawaii-perler-bead-patterns": "bg-primary-fixed",
  "farm-friends": "bg-tertiary-fixed",
  "cat-perler-bead-patterns": "bg-primary-fixed",
  "ocean-life": "bg-secondary-container",
  "panda-perler-bead-patterns": "bg-surface-container-highest",
  safari: "bg-tertiary-fixed",
  "christmas-perler-bead-patterns": "bg-secondary-container",
  "baby-animals": "bg-primary-fixed",
  "halloween-perler-bead-patterns": "bg-tertiary-container",
  "pixel-art-perler-bead-patterns": "bg-primary-container",
  "flower-perler-bead-patterns": "bg-primary-fixed",
  "gaming-perler-bead-patterns": "bg-primary-container",
  "food-drink-perler-bead-patterns": "bg-tertiary-fixed",
  "character-perler-bead-patterns": "bg-secondary-container",
  "nature-perler-bead-patterns": "bg-secondary-container",
  "fantasy-mythical-perler-bead-patterns": "bg-primary-container",
  "heart-perler-bead-patterns": "bg-error-container",
  "insect-perler-bead-patterns": "bg-secondary-container",
  "medium-perler-bead-patterns": "bg-secondary-container",
  "retro-perler-bead-patterns": "bg-tertiary-fixed",
  "rainbow-perler-bead-patterns": "bg-primary-fixed",
  birthday: "bg-primary-fixed",
  "seasonal-holiday-perler-bead-patterns": "bg-error-container",
  "charm-collection": "bg-primary-fixed",
};

interface CollectionCardProps {
  collection: Collection;
  variant?: "default" | "page";
}

export default function CollectionCard({ collection, variant = "default" }: CollectionCardProps) {
  const emoji = collectionEmojis[collection.slug] || collection.emoji || "✨";
  const color = collectionColors[collection.slug] || "bg-surface-container";
  const count = collection.patternCount ?? collection.count ?? 0;

  if (variant === "page") {
    return (
      <Link
        href={`/collection/${collection.slug}`}
        className="group block bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden hover:-translate-y-1 hover:border-primary/30 transition-all"
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
          <h3 className="font-quicksand font-bold text-headline-md text-on-surface mb-1">{collection.title}</h3>
          <p className="text-body-md text-on-surface-variant line-clamp-2">
            {collection.description || `Explore the ${collection.title} collection.`}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/collection/${collection.slug}`} className="group">
      <div className={`rounded-3xl ${color} p-6 transition-transform group-hover:scale-[1.02] h-full flex flex-col`}>
        <div className="flex items-start justify-between mb-4">
          <span className="text-4xl">{emoji}</span>
          <span className="text-xs font-bold bg-surface-container-lowest/80 text-on-surface px-2 py-1 rounded-full">{count} patterns</span>
        </div>
        <h3 className="font-quicksand font-bold text-body-lg mb-2">{collection.title}</h3>
        <p className="text-body-sm text-on-surface-variant mb-5 flex-grow">{collection.description}</p>
        <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary group-hover:underline">
          View Collection
        </span>
      </div>
    </Link>
  );
}
