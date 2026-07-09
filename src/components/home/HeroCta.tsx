"use client";

import Link from "next/link";

export default function HeroCta() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
      <Link
        href="/category/animals"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-white text-sm font-medium hover:bg-primary transition-colors"
      >
        Browse Patterns
      </Link>
      <Link
        href="/generate"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-white text-sm font-medium hover:bg-primary transition-colors"
      >
        AI Generator
      </Link>
    </div>
  );
}
