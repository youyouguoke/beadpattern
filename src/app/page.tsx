import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import DiscoverToday from "@/components/home/DiscoverToday";
import TrendingPatterns from "@/components/home/TrendingPatterns";
import ExploreCategories from "@/components/home/ExploreCategories";
import CollectionsSection from "@/components/home/CollectionsSection";
import InspirationGallery from "@/components/home/InspirationGallery";
import GeneratorCta from "@/components/home/GeneratorCta";
import HowItWorks from "@/components/home/HowItWorks";
import SeoSection from "@/components/home/SeoSection";

export const metadata: Metadata = {
  title: "BeadPatternAI | Discover Printable Perler Bead Patterns",
  description: "Browse thousands of printable Perler bead patterns. Discover, download, and create beautiful bead templates with AI when you can't find the perfect match.",
};

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <DiscoverToday />
      <CollectionsSection />
      <InspirationGallery />
      <ExploreCategories />
      <GeneratorCta />
      <HowItWorks />
      <SeoSection />
    </main>
  );
}
