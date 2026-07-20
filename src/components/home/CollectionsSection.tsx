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
    <section className="bg-surface py-16 md:py-24">
      <div className="container-main">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="section-title text-primary">Popular Collections</h2>
            <p className="section-subtitle mt-2">Curated themes for every project</p>
          </div>
          <Link href="/collections" className="text-label-md text-on-surface-variant hover:text-primary flex items-center gap-1">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.slice(0, 6).map((c) => (
            <CollectionCard key={c.slug} collection={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
