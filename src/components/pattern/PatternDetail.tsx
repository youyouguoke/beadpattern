"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Pattern, PatternDetail as PatternDetailType } from "@/types";
import { getPatternBySlug } from "@/lib/publicApiService";
import PatternHero from "./PatternHero";
import PatternGallery from "./PatternGallery";
import PatternAbout from "./PatternAbout";
import PatternSteps from "./PatternSteps";
import PatternFaq from "./PatternFaq";
import GenerateSimilar from "./GenerateSimilar";
import ShareCard from "./ShareCard";

interface PatternDetailProps {
  slug: string;
  initialPattern?: PatternDetailType | null;
  initialFinishedImage?: { type: "image" | "svg"; src: string; svg?: string } | null;
}

const TAB_MAP: Record<string, string> = {
  "finished-photo": "Finished Photo",
  "finished_photo": "Finished Photo",
  finished: "Finished Photo",
  pattern: "Pattern",
  "color-chart": "Color Chart",
  "color_chart": "Color Chart",
  palette: "Color Chart",
  guide: "Guide",
  steps: "Guide",
};

export default function PatternDetail({ slug, initialPattern, initialFinishedImage }: PatternDetailProps) {
  const [pattern, setPattern] = useState<PatternDetailType | null>(initialPattern || null);
  const [loading, setLoading] = useState(!initialPattern);
  const [finishedImage, setFinishedImage] = useState<{ type: "image" | "svg"; src: string; svg?: string } | null>(initialFinishedImage || null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Finished Photo");

  useEffect(() => {
    if (!initialPattern) {
      setLoading(true);
      getPatternBySlug(slug).then((p) => {
        setPattern(p);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [slug, initialPattern]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(TAB_MAP[tab] || tab);
  }, [searchParams]);

  if (loading) return <div className="pt-28 text-center">Loading pattern...</div>;
  if (!pattern) return <div className="pt-28 text-center">Pattern not found.</div>;

  return (
    <div className="space-y-8">
      <PatternHero pattern={pattern as unknown as Pattern} />
      <PatternGallery
        pattern={pattern as unknown as Pattern}
        finishedImage={finishedImage}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
      />
      <PatternAbout pattern={pattern as unknown as Pattern} />
      <PatternSteps steps={pattern.steps} />
      <PatternFaq faqs={pattern.faqs} />
      <GenerateSimilar title={pattern.title} />
      <ShareCard pattern={pattern as unknown as Pattern} />
    </div>
  );
}
