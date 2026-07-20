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
  animals: "bg-primary-fixed",
  characters: "bg-secondary-fixed",
  "food-drink": "bg-tertiary-fixed",
  nature: "bg-secondary-container",
  gaming: "bg-tertiary-container",
  "seasonal-holidays": "bg-error-container",
  "fantasy-mythical": "bg-primary-container",
  "objects-symbols": "bg-surface-container-high",
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
        className="group block bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 hover:-translate-y-1 hover:border-primary/30 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-3xl`}>
            {icon}
          </div>
          <span className="text-label-sm text-on-surface-variant">{count} patterns</span>
        </div>
        <h3 className="font-quicksand font-bold text-headline-md text-on-surface mb-1">{category.name}</h3>
        <p className="text-body-md text-on-surface-variant line-clamp-2">
          {category.description || `Explore ${category.name} bead patterns.`}
        </p>
      </Link>
    );
  }

  return (
    <Link href={`/category/${category.slug}`} className="group">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden bead-shadow transition-all hover:-translate-y-1 cursor-pointer">
        <div className="aspect-square overflow-hidden bg-surface-container-low relative">
          <div className={`w-full h-full flex items-center justify-center ${color}`}>
            <span className="text-6xl" role="img" aria-label={category.name}>
              {icon}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-quicksand font-bold text-body-md">{category.name}</h3>
          <p className="text-label-sm text-on-surface-variant mt-1">{count.toLocaleString()} patterns</p>
        </div>
      </div>
    </Link>
  );
}
