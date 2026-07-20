import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/generate`;

export const metadata: Metadata = {
  title: "AI Bead Pattern Generator | BeadPatternAI",
  description: "Generate Perler bead patterns with AI. Customize grid size, palette, and style to create printable bead templates.",
  keywords: ["AI bead pattern generator", "perler bead AI", "generate fuse bead patterns", "pixel art generator", "bead pattern maker"],
  openGraph: {
    title: "AI Bead Pattern Generator | BeadPatternAI",
    description: "Generate Perler bead patterns with AI. Customize grid size, palette, and style to create printable bead templates.",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Bead Pattern Generator | BeadPatternAI",
    description: "Generate Perler bead patterns with AI. Customize grid size, palette, and style to create printable bead templates.",
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
    <main className="min-h-screen flex items-center justify-center px-4 md:px-12 py-20 bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary text-on-primary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl">auto_awesome</span>
        </div>
        <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-primary">
          AI Pattern Generator
        </h1>
        <p className="text-on-surface-variant text-lg">
          We&apos;re building something amazing here. The AI pattern generator is not ready yet — please check back soon.
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            Browse Patterns
          </a>
        </div>
      </div>
    </main>
  );
}
