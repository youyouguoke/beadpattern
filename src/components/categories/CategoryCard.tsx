import Link from "next/link";
import { Category } from "@/lib/publicApiService";

const categoryIcons: Record<string, string> = {
  animals: "🐰",
  characters: "🦸",
  "food-drink": "🍧",
  nature: "🌻",
  gaming: "👾",
  "seasonal-holidays": "🎊",
  "fantasy-mythical": "🧚",
  "objects-symbols": "💎",
};

const categoryColors: Record<string, string> = {
  animals: "bg-pink-100",
  characters: "bg-sky-100",
  "food-drink": "bg-amber-100",
  nature: "bg-emerald-100",
  gaming: "bg-violet-100",
  "seasonal-holidays": "bg-red-100",
  "fantasy-mythical": "bg-fuchsia-100",
  "objects-symbols": "bg-blue-100",
};

interface CategoryCardProps {
  category: Category;
  variant?: "default" | "page";
}

export default function CategoryCard({ category, variant = "default" }: CategoryCardProps) {
  const icon = categoryIcons[category.slug] || "✨";
  const color = categoryColors[category.slug] || "bg-surface-container";
  const count = category.patternCount ?? category.count ?? 0;

  if (variant === "page") {
    return (
      <Link
        href={`/category/${category.slug}`}
        className="group block bg-white rounded-2xl p-6 border border-secondary-container shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-3xl`}>
            {icon}
          </div>
          <span className="text-label-sm text-on-surface-variant">{count} patterns</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{category.name}</h3>
        <p className="text-body-md text-on-surface-variant line-clamp-2">
          {category.description || `Explore ${category.name} bead patterns.`}
        </p>
      </Link>
    );
  }

  return (
    <Link href={`/category/${category.slug}`} className="group">
      <div className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden cursor-pointer">
        <div className="aspect-square overflow-hidden bg-secondary-container relative">
          <div className={`w-full h-full flex items-center justify-center ${color}`}>
            <span className="text-6xl" role="img" aria-label={category.name}>
              {icon}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-headline-md text-body-md">{category.name}</h3>
          <p className="text-label-sm text-secondary mt-1">{count.toLocaleString()} patterns</p>
        </div>
      </div>
    </Link>
  );
}
