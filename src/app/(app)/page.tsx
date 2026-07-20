import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import TrendingPatterns from "@/components/home/TrendingPatterns";
import NewPatterns from "@/components/home/NewPatterns";
import ExploreCategories from "@/components/home/ExploreCategories";
import CollectionsSection from "@/components/home/CollectionsSection";
import GeneratorCta from "@/components/home/GeneratorCta";
import HowItWorks from "@/components/home/HowItWorks";
import SeoSection from "@/components/home/SeoSection";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL = "https://beadpatternai.com";

export const metadata: Metadata = {
  title: "Cute Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
  description: "Browse thousands of free printable Perler bead patterns. Each design includes a bead grid, color guide, and step-by-step instructions. Download PDF or PNG templates instantly.",
  keywords: ["perler bead patterns", "fuse bead templates", "Hama bead patterns", "free bead patterns printable", "Perler bead PDF", "kawaii bead patterns", "pixel art templates"],
  openGraph: {
    title: "Cute Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
    description: "Browse thousands of free printable Perler bead patterns with color guides and printable grids.",
    type: "website",
    url: SITE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cute Perler Bead Patterns | Free Printable Grids | BeadPatternAI",
    description: "Browse thousands of free printable Perler bead patterns with color guides and printable grids.",
  },
  alternates: { canonical: SITE_URL },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "BeadPatternAI",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "BeadPatternAI",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
  ],
};

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <JsonLd data={structuredData} />
      <HeroSection />
      <TrendingPatterns />
      <NewPatterns />
      <ExploreCategories />
      <CollectionsSection />
      <GeneratorCta />
      <HowItWorks />
      <SeoSection />
    </main>
  );
}
