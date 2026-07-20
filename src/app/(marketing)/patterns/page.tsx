import type { Metadata } from "next";
import PatternArchive from "@/components/archive/PatternArchive";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/patterns`;

export const metadata: Metadata = {
  title: "Browse Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
  description: "Browse thousands of printable Perler bead patterns. Filter by difficulty, category, and grid size. Download free PDF and PNG templates.",
  keywords: ["perler bead patterns", "browse bead patterns", "free printable grids", "fuse bead patterns", "Hama bead designs", "pixel art templates"],
  openGraph: {
    title: "Browse Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
    description: "Browse thousands of printable Perler bead patterns. Filter by difficulty, category, and grid size.",
    type: "website",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
    description: "Browse thousands of printable Perler bead patterns. Filter by difficulty, category, and grid size.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Patterns", item: PAGE_URL },
  ],
};

export default function PatternsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="container-main py-8 pt-28">
        <PatternArchive />
      </div>
    </main>
  );
}
