import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import DiscoverToday from "@/components/home/DiscoverToday";
import TrendingPatterns from "@/components/home/TrendingPatterns";
import PromptIdeas from "@/components/home/PromptIdeas";
import ExploreCategories from "@/components/home/ExploreCategories";
import CollectionsSection from "@/components/home/CollectionsSection";
import InspirationGallery from "@/components/home/InspirationGallery";
import SeoSection from "@/components/home/SeoSection";

export const metadata: Metadata = {
  title: "BeadPatternAI | AI Perler Bead Pattern Generator",
  description: "Create, discover & download beautiful bead patterns with AI. Generate printable Perler bead templates from any idea in seconds.",
};

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <DiscoverToday />
      <TrendingPatterns />
      <PromptIdeas />
      <ExploreCategories />
      <CollectionsSection />
      <InspirationGallery />
      <SeoSection />
    </main>
  );
}
