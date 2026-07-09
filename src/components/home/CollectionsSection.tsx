"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Collection, getCollections } from "@/lib/publicApiService";
import CollectionCard from "@/components/collections/CollectionCard";

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
          <CollectionCard key={c.slug} collection={c} />
        ))}
      </div>
    </section>
  );
}
