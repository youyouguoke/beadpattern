import type { Metadata } from "next";
import BeadPatternGenerator from "@/components/generate/BeadPatternGenerator";

export const metadata: Metadata = {
  title: "AI Bead Pattern Generator | BeadPatternAI",
  description: "Generate Perler bead patterns with AI. Customize grid size, palette, and style to create printable bead templates.",
};

export default function GeneratePage() {
  return (
    <main className="px-4 md:px-12 py-8 max-w-screen-2xl mx-auto">
      <BeadPatternGenerator />
    </main>
  );
}
