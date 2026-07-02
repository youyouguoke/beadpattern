import type { Metadata } from "next";
import PatternArchive from "@/components/archive/PatternArchive";

export const metadata: Metadata = {
  title: "Kawaii Bead Patterns - BeadPatternAI",
  description: "Browse hundreds of cute printable kawaii bead templates. From tiny animals to sweet treats, find your next Perler bead project.",
};

export default function CategoryPage() {
  return (
    <main className="pt-8 pb-20 px-4 md:px-12 max-w-screen-2xl mx-auto">
      <PatternArchive />
    </main>
  );
}
