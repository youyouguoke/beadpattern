import type { Metadata } from "next";
import Link from "next/link";
import BeadPatternGeneratorBeta from "@/components/generate/BeadPatternGeneratorBeta";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/generate`;

export const metadata: Metadata = {
  title: "AI Bead Pattern Generator | BeadPatternAI",
  description: "Generate Perler bead patterns with AI. Search existing templates or preview a custom bead-by-bead design before saving.",
  keywords: ["AI bead pattern generator", "perler bead AI", "generate fuse bead patterns", "pixel art generator", "bead pattern maker"],
  openGraph: {
    title: "AI Bead Pattern Generator | BeadPatternAI",
    description: "Generate Perler bead patterns with AI. Search existing templates or preview a custom bead-by-bead design before saving.",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Bead Pattern Generator | BeadPatternAI",
    description: "Generate Perler bead patterns with AI. Search existing templates or preview a custom bead-by-bead design before saving.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Generate", item: PAGE_URL },
  ],
};

export default function GeneratePage() {
  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">Generate</span>
        </nav>

        <BeadPatternGeneratorBeta />
      </div>
    </main>
  );
}
