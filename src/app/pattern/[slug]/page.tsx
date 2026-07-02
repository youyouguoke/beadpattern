import type { Metadata } from "next";
import { Suspense } from "react";
import PatternDetail from "@/components/pattern/PatternDetail";

export const metadata: Metadata = {
  title: "Pattern Detail | BeadPatternAI",
  description: "Detailed perler bead pattern, color palette, and step-by-step guide.",
};

export default function PatternDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="px-4 md:px-12 py-8 max-w-screen-2xl mx-auto">
      <Suspense fallback={<div>Loading pattern...</div>}>
        <PatternDetail params={params} />
      </Suspense>
    </main>
  );
}
