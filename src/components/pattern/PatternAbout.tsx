"use client";

import type { Pattern } from "@/types";
import Link from "next/link";

interface PatternAboutProps {
  pattern: Pattern;
}

export default function PatternAbout({ pattern }: PatternAboutProps) {
  const gridSize = pattern.gridSize ?? pattern.grid ?? "-";
  const beads = pattern.estimatedBeads ?? pattern.beadCount ?? 0;
  const colors = pattern.colorCount ?? pattern.colorPalette?.length ?? 0;
  const category = pattern.categories?.[0];

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
      <h2 className="font-headline-md text-headline-md mb-4">About This Pattern</h2>
      <div className="text-secondary space-y-4 font-body-md">
        <p>
          This <strong className="text-on-surface">{pattern.title}</strong> Perler bead pattern is a {pattern.difficulty?.toLowerCase()} design on a {gridSize} grid. It uses approximately {beads.toLocaleString()} beads across {colors} colors, making it a great choice for crafters who want a clear and satisfying project.
        </p>
        {category && (
          <p>
            Browse more patterns like this in the <Link href={`/category/${category.slug}`} className="text-primary underline">{category.name}</Link> category.
          </p>
        )}
        <p>
          The downloadable PDF includes a color chart, a bead-by-bead grid, and step-by-step instructions. Print it at 100% scale and slide under a transparent pegboard to start crafting right away.
        </p>
      </div>
    </div>
  );
}
