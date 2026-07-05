"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPattern, getRelatedPatterns, Pattern } from "@/lib/patternService";
import { getPatternImage } from "@/components/BeadRenderer";
import PatternHero from "./PatternHero";
import PatternGallery from "./PatternGallery";
import PatternSidebar from "./PatternSidebar";
import PatternAbout from "./PatternAbout";
import PatternFaq from "./PatternFaq";
import RelatedPatterns from "./RelatedPatterns";

interface PatternDetailProps {
  slug: string;
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

export default function PatternDetail({ slug }: PatternDetailProps) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishedImage, setFinishedImage] = useState<{ type: "image" | "svg"; src: string; svg?: string } | null>(null);
  const [related, setRelated] = useState<Pattern[]>([]);
  const [relatedImages, setRelatedImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Finished Photo");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPattern(slug)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setPattern(p);
          setFinishedImage(getPatternImage(p, { width: 560, height: 560, preferGrid: true }));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    getRelatedPatterns(slug).then((items) => {
      if (cancelled) return;
      setRelated(items);
      const map: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of items) {
        map[p.slug] = getPatternImage(p, { width: 240, height: 240, preferGrid: true });
      }
      setRelatedImages(map);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(TAB_MAP[tab] || tab);
    }
  }, [searchParams]);

  const handleDownloadPNG = () => {
    const img = finishedImage?.type === "image" ? pattern?.finished : finishedImage?.src;
    if (!img || !pattern) return;
    if (img.startsWith("data:image/svg+xml")) {
      const link = document.createElement("a");
      link.href = img;
      link.download = `${pattern.title.replace(/\s+/g, "-").toLowerCase()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    fetch(img, { mode: "cors", credentials: "omit" })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pattern.title.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => window.open(img, "_blank"));
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !pattern) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const printRef = document.querySelector('[data-print-root]') as HTMLDivElement | null;
    if (!printRef) return;
    const canvas = await html2canvas(printRef, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${pattern.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  if (loading) return <div className="pt-28 text-center">Loading pattern...</div>;
  if (!pattern) return <div className="pt-28 text-center">Pattern not found.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <PatternHero pattern={pattern} />
        <PatternGallery
          pattern={pattern}
          finishedImage={finishedImage}
          defaultTab={activeTab}
          onTabChange={setActiveTab}
        />
        <PatternAbout pattern={pattern} />
        <PatternFaq />
      </div>

      <PatternSidebar
        pattern={pattern}
        onDownloadPDF={handleDownloadPDF}
        onDownloadPNG={handleDownloadPNG}
      />

      <RelatedPatterns patterns={related} images={relatedImages} />
    </div>
  );
}
