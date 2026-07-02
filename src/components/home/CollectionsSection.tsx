"use client";

import Link from "next/link";

const collections = [
  { title: "Halloween Collection", slug: "halloween", emoji: "🎃", count: 120, color: "bg-secondary-container text-on-secondary-container" },
  { title: "Christmas Collection", slug: "christmas", emoji: "🎄", count: 95, color: "bg-error-container text-on-error-container" },
  { title: "Cute Animals", slug: "cute-animals", emoji: "🐱", count: 210, color: "bg-primary-fixed text-on-primary-fixed-variant" },
  { title: "Food Series", slug: "food", emoji: "🍓", count: 88, color: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  { title: "Beginner Patterns", slug: "beginner", emoji: "🌱", count: 156, color: "bg-tertiary-container text-white" },
  { title: "8 Color Patterns", slug: "8-color", emoji: "🎨", count: 64, color: "bg-surface-container-highest text-secondary" },
  { title: "16 Color Patterns", slug: "16-color", emoji: "🖍️", count: 42, color: "bg-primary-container text-white" },
];

export default function CollectionsSection() {
  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Curated Collections</h2>
          <p className="text-secondary text-sm mt-1">SEO landing pages for every theme</p>
        </div>
        <Link href="#" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {collections.map((c) => (
          <Link key={c.slug} href={`/collection/${c.slug}`} className="group">
            <div className={`aspect-[4/5] rounded-2xl ${c.color} flex flex-col items-center justify-center p-4 transition-transform group-hover:scale-105`}>
              <span className="text-4xl mb-3">{c.emoji}</span>
              <h3 className="font-headline-md text-body-sm text-center leading-tight">{c.title}</h3>
              <p className="text-xs opacity-90 mt-1">{c.count} patterns</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
