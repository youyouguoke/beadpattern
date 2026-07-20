"use client";

import { useState } from "react";
import type { Pattern, PatternDetail as PatternDetailType } from "@/types";
import PatternGallery from "./PatternGallery";
import PatternInfoCard from "./PatternInfoCard";
import PatternGrid from "./PatternGrid";
import PatternColorKey from "./PatternColorKey";
import PatternAbout from "./PatternAbout";
import PatternSteps from "./PatternSteps";
import PatternFaq from "./PatternFaq";
import GenerateSimilar from "./GenerateSimilar";
import ShareCard from "./ShareCard";
import RelatedPatterns from "./RelatedPatterns";
import PatternInternalLinks from "./PatternInternalLinks";
import { downloadPng, downloadPdf } from "@/lib/downloads";
import { renderBeadGrid } from "@/lib/patternImage";

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
  const [selectedSize, setSelectedSize] = useState(1);

  const paletteHex = (pattern.colorPalette || []).map((c) => c.hex);
  const patternGrid = pattern.gridData
    ? renderBeadGrid(pattern.gridData, paletteHex, {
        width: 560 * selectedSize,
        height: 560 * selectedSize,
        showGrid: true,
        gap: 1,
        beadRadius: 2,
      })
    : null;

  const handleDownloadPNG = () => {
    downloadPng(slug, selectedSize).catch(() => {
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
    downloadPdf(slug, selectedSize).catch(() => setPdfFallback(true));
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
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <PatternGallery pattern={pattern} finishedImage={finishedImage} />
        </div>

        <div className="space-y-6">
          <PatternInfoCard
            pattern={pattern}
            onDownloadPDF={pdfFallback ? handleFallbackPDF : handleDownloadPDF}
            onDownloadPNG={handleDownloadPNG}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
          />
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <PatternGrid pattern={pattern} />
        </div>
        <div className="space-y-6">
          <PatternColorKey pattern={pattern} />

          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/20">
            <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Maker Tips</h2>
            <div className="space-y-6">
              {[
                {
                  icon: "iron",
                  title: "Ironing Instructions",
                  body: "Use medium heat and parchment paper. Iron in circular motions for 20-30 seconds.",
                  color: "bg-primary-container text-on-primary-container",
                },
                {
                  icon: "inventory_2",
                  title: "Bead Storage",
                  body: "Sort colors beforehand to save time and avoid mistakes during assembly.",
                  color: "bg-secondary-container text-on-secondary-container",
                },
                {
                  icon: "frame_inspect",
                  title: "Framing Your Work",
                  body: "This design fits perfectly in a standard shadow box frame for display.",
                  color: "bg-tertiary-fixed text-on-tertiary-fixed",
                },
              ].map((tip) => (
                <div key={tip.title} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                    <span className="material-symbols-outlined">{tip.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{tip.title}</h4>
                    <p className="text-body-sm text-on-surface-variant">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        <PatternAbout pattern={pattern} />
        <PatternSteps steps={pattern.steps} />
        <PatternFaq faqs={pattern.faqs} />
        <PatternInternalLinks pattern={pattern} />
        <GenerateSimilar title={pattern.title} />
        <ShareCard pattern={pattern} />
        <RelatedPatterns patterns={related} images={relatedImages} />
      </div>

      <div
        data-print-root
        className="bg-white p-8 w-[800px]"
        style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }}
      >
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-primary mb-2">{pattern.title}</div>
          <p className="text-gray-600">
            {pattern.difficulty} • {pattern.gridSize} • {(pattern.estimatedBeads ?? 0).toLocaleString()} beads
          </p>
        </div>
        <div className="flex justify-center mb-6">
          {patternGrid ? (
            <div dangerouslySetInnerHTML={{ __html: patternGrid.svg }} />
          ) : (
            <img
              src={pattern.finishedImage || pattern.coverImage}
              alt={pattern.title}
              className="max-w-md rounded-xl"
              crossOrigin="anonymous"
            />
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Color Chart</h2>
          <div className="grid grid-cols-2 gap-3">
            {pattern.colorPalette?.map((c, i) => (
              <div key={c.hex + i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: c.hex }} />
                <div className="text-sm">
                  <p className="font-semibold">{c.name || `Color ${i + 1}`}</p>
                  <p className="text-gray-600">{c.code || c.hex} • {c.count} beads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-3">Step-by-Step Guide</h2>
          <ol className="list-decimal list-inside space-y-2">
            {pattern.steps?.map((step, i) => (
              <li key={i} className="text-gray-600">{step.description}</li>
            ))}
          </ol>
        </div>
        <div className="mt-8 text-center text-xs text-gray-500">
          Generated by BeadPatternAI • beadpatternai.com
        </div>
      </div>
    </div>
  );
}
