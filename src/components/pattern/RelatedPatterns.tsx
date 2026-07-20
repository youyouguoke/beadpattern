import type { Pattern } from "@/types";
import Link from "next/link";

interface RelatedPatternsProps {
  patterns: Pattern[];
  images: Record<string, { type: "image" | "svg"; src: string; svg?: string }>;
}

export default function RelatedPatterns({ patterns, images }: RelatedPatternsProps) {
  if (patterns.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-quicksand font-bold text-headline-sm text-on-surface">Similar Patterns</h2>
        <Link
          href="/patterns"
          className="text-on-surface-variant font-label-sm flex items-center gap-1 hover:text-primary transition-colors"
        >
          View All <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patterns.slice(0, 4).map((p) => (
          <Link key={p.slug} href={`/pattern/${p.slug}`} className="group">
            <div className="bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/20 hover:-translate-y-1 hover:border-primary/30 transition-all">
              <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-surface-container-low">
                {images[p.slug]?.type === "svg" ? (
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: images[p.slug]!.svg || "" }} />
                ) : images[p.slug]?.type === "image" ? (
                  <img className="w-full h-full object-cover" alt={p.title} src={images[p.slug]!.src} />
                ) : (
                  <div className="w-full h-full bg-surface-container-low" />
                )}
              </div>
              <p className="font-label-sm text-on-surface truncate">{p.title}</p>
              <p className="text-on-surface-variant text-sm">{p.difficulty} • {(p.estimatedBeads ?? p.beadCount ?? 0).toLocaleString()} beads</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
