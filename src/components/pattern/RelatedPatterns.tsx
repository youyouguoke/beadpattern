import type { Pattern } from "@/types";
import Link from "next/link";

interface RelatedPatternsProps {
  patterns: Pattern[];
  images: Record<string, { type: "image" | "svg"; src: string; svg?: string }>;
}

export default function RelatedPatterns({ patterns, images }: RelatedPatternsProps) {
  if (patterns.length === 0) return null;

  return (
    <div className="lg:col-span-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline-md text-headline-md">Related Patterns</h2>
        <Link
          href="/patterns"
          className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors"
        >
          View All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {patterns.map((p) => (
          <Link key={p.slug} href={`/pattern/${p.slug}`} className="group">
            <div className="bg-white rounded-2xl p-3 border border-secondary-container hover:-translate-y-1 transition-transform">
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container">
                {images[p.slug]?.type === "svg" ? (
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
                ) : images[p.slug]?.type === "image" ? (
                  <img className="w-full h-full object-cover" alt={p.title} src={images[p.slug]!.src} />
                ) : (
                  <div className="w-full h-full bg-surface-container" />
                )}
              </div>
              <p className="font-label-sm truncate">{p.title}</p>
              <p className="text-secondary text-sm">{p.difficulty} &bull; {(p.estimatedBeads ?? p.beadCount ?? 0).toLocaleString()} beads</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
