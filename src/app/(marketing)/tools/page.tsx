import type { Metadata } from "next";
import Link from "next/link";
import BeadCalculator from "@/components/tools/BeadCalculator";
import GridConverter from "@/components/tools/GridConverter";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/tools`;

export const metadata: Metadata = {
  title: "Free Perler Bead Tools | Calculator & Grid Converter | BeadPatternAI",
  description: "Free tools for Perler bead crafters: bead count calculator, finished size estimator, and grid size converter for different bead brands.",
  keywords: ["perler bead calculator", "fuse bead tools", "grid converter", "bead size calculator", "perler bead finished size"],
  openGraph: {
    title: "Free Perler Bead Tools | Calculator & Grid Converter | BeadPatternAI",
    description: "Free tools for Perler bead crafters: bead count calculator, finished size estimator, and grid size converter.",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Perler Bead Tools | Calculator & Grid Converter | BeadPatternAI",
    description: "Free tools for Perler bead crafters: bead count calculator and grid size converter.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Tools", item: PAGE_URL },
  ],
};

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">Tools</span>
        </nav>

        <div className="mb-10">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-on-surface mb-3">
            Bead Craft Tools
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Quick free calculators and converters to plan your next Perler bead project.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Bead Calculator</h2>
          <BeadCalculator />
        </section>

        <section className="mb-16">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Grid Converter</h2>
          <GridConverter />
        </section>
      </div>
    </main>
  );
}
