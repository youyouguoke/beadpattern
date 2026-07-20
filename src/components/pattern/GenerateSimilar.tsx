"use client";

import Link from "next/link";

interface GenerateSimilarProps {
  title: string;
}

export default function GenerateSimilar({ title }: GenerateSimilarProps) {
  return (
    <div className="bg-primary-container/10 rounded-3xl p-6 md:p-8 border border-primary-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-1">Can&apos;t find the right variation?</h2>
          <p className="text-on-surface-variant font-body-md">Generate a similar Perler bead pattern with AI based on &quot;{title}&quot;.</p>
        </div>
        <Link
          href={`/generate?q=${encodeURIComponent(title)}`}
          className="shrink-0 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md font-bold flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          Generate Similar
        </Link>
      </div>
      <p className="text-xs text-on-surface-variant mt-3">Free 3 AI generations daily. We first search existing patterns before creating a new one.</p>
    </div>
  );
}
