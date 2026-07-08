import type { Metadata } from "next";
import PatternArchive from "@/components/archive/PatternArchive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Patterns - BeadPatternAI",
  description: "Browse thousands of printable Perler bead patterns. Filter by difficulty, category, and grid size.",
};

export default function PatternsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <PatternArchive />
      </div>
    </main>
  );
}
