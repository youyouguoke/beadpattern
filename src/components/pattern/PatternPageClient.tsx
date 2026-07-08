"use client";

import { useState } from "react";
import type { Pattern, PatternDetail as PatternDetailType } from "@/types";
import PatternDetail from "@/components/pattern/PatternDetail";
import PatternSidebar from "@/components/pattern/PatternSidebar";
import RelatedPatterns from "@/components/pattern/RelatedPatterns";
import { downloadPng, downloadPdf } from "@/lib/downloads";

interface PatternPageClientProps {
  slug: string;
  pattern: PatternDetailType;
  related: Pattern[];
  relatedImages: Record<string, { type: "image" | "svg"; src: string; svg?: string }>;
  finishedImage: { type: "image" | "svg"; src: string; svg?: string };
}

export default function PatternPageClient({
  slug,
  pattern,
  related,
  relatedImages,
  finishedImage,
}: PatternPageClientProps) {
  const [pdfFallback, setPdfFallback] = useState(false);

  const handleDownloadPNG = () => {
    downloadPng(slug).catch(() => {
      const img = finishedImage?.type === "image"
        ? pattern.finishedImage || pattern.coverImage
        : finishedImage?.src;
      if (!img) return;
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
    });
  };

  const handleDownloadPDF = () => {
    downloadPdf(slug).catch(() => setPdfFallback(true));
  };

  const handleFallbackPDF = () => {
    setPdfFallback(false);
    if (typeof window === "undefined") return;
    Promise.all([import("jspdf"), import("html2canvas")])
      .then(([{ default: jsPDF }, { default: html2canvas }]) => {
        const printRef = document.querySelector("[data-print-root]") as HTMLDivElement | null;
        if (!printRef) return;
        return html2canvas(printRef, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
          pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
          pdf.save(`${pattern.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
        });
      })
      .catch(() => null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <PatternDetail slug={slug} initialPattern={pattern} initialFinishedImage={finishedImage} />
      </div>
      <PatternSidebar
        pattern={pattern}
        onDownloadPDF={pdfFallback ? handleFallbackPDF : handleDownloadPDF}
        onDownloadPNG={handleDownloadPNG}
      />
      <RelatedPatterns patterns={related} images={relatedImages} />
    </div>
  );
}
