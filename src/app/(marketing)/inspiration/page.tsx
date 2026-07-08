import type { Metadata } from "next";
import InspirationGallery from "@/components/home/InspirationGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inspiration Gallery - BeadPatternAI",
  description: "Browse Pinterest-style Perler bead pattern inspiration. Discover community-made designs, trending ideas, and printable templates.",
  openGraph: {
    title: "Inspiration Gallery - BeadPatternAI",
    description: "Browse Pinterest-style Perler bead pattern inspiration. Discover community-made designs, trending ideas, and printable templates.",
    url: "https://beadpatternai.com/inspiration",
    siteName: "BeadPatternAI",
    type: "website",
  },
};

export default function InspirationPage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-2">
            Inspiration Gallery
          </h1>
          <p className="font-body-lg text-on-surface-variant">
            Pinterest-style Perler bead pattern inspiration from the community.
          </p>
        </div>
      </div>
      <InspirationGallery />
    </main>
  );
}
