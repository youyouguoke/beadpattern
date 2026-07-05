"use client";

import Link from "next/link";
import { Pattern } from "@/lib/patternService";

interface PatternHeroProps {
  pattern: Pattern;
}

export default function PatternHero({ pattern }: PatternHeroProps) {
  return (
    <div className="space-y-2">
      <nav className="text-secondary font-body-md text-sm">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/category/animals" className="hover:text-primary">Patterns</Link>
        <span className="mx-2">/</span>
        <span className="text-primary">{pattern.title}</span>
      </nav>
      <h1 className="font-display-lg text-display-lg-mobile text-primary">{pattern.title}</h1>
      <p className="text-secondary font-body-lg">
        A kawaii Perler bead pattern featuring a tiny {pattern.title.split(" ")[0].toLowerCase()} design.
      </p>
    </div>
  );
}
