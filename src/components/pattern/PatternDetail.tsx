"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPattern, getRelatedPatterns, Pattern } from "@/lib/patternService";
import SaveButton from "./SaveButton";
import BeadRenderer, { getPatternImage, renderBeadGrid } from "@/components/BeadRenderer";

interface PatternDetailProps {
  slug: string;
}

export default function PatternDetail({ slug }: PatternDetailProps) {
  const [activeTab, setActiveTab] = useState("Finished Photo");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishedImage, setFinishedImage] = useState<{ type: "image" | "svg"; src: string; svg?: string } | null>(null);
  const [related, setRelated] = useState<Pattern[]>([]);
  const [relatedImages, setRelatedImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPattern(slug).then((p) => {
      if (cancelled) return;
      if (p) {
        setPattern(p);
        setFinishedImage(getPatternImage(p, { width: 560, height: 560, preferGrid: true }));
      }
      setLoading(false);
    }).catch(() => {
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

    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      const map: Record<string, string> = {
        "finished-photo": "Finished Photo",
        "finished_photo": "Finished Photo",
        "finished": "Finished Photo",
        pattern: "Pattern",
        "color-chart": "Color Chart",
        "color_chart": "Color Chart",
        palette: "Color Chart",
        guide: "Guide",
        steps: "Guide",
      };
      setActiveTab(map[tab] || tab);
    }
  }, [searchParams]);

  const patternGrid = useMemo(() => {
    if (!pattern) return null;
    if (pattern.gridData) {
      return renderBeadGrid(pattern.gridData, pattern.colorPalette, { width: 560, height: 560, showGrid: true, gap: 1, beadRadius: 2 });
    }
    return null;
  }, [pattern]);

  if (loading) return <div className="pt-28 text-center">Loading pattern...</div>;
  if (!pattern) return <div className="pt-28 text-center">Pattern not found.</div>;

  const handleDownloadPNG = () => {
    const img = finishedImage?.type === "image" ? pattern.finished : finishedImage?.src;
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
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined") return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const el = printRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${pattern.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const printContent = (
    <div
      ref={printRef}
      className="bg-white p-8 w-[800px]"
      style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }}
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">{pattern.title}</h1>
        <p className="text-secondary">{pattern.difficulty} • {pattern.grid} • {pattern.beadCount.toLocaleString()} beads</p>
      </div>
      <div className="flex justify-center mb-6">
        {patternGrid ? (
          <div dangerouslySetInnerHTML={{ __html: patternGrid.svg }} />
        ) : (
          <img src={pattern.finished} alt={pattern.title} className="max-w-md rounded-xl" crossOrigin="anonymous" />
        )}
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Color Chart</h2>
        <div className="grid grid-cols-2 gap-3">
          {pattern.palette.map((c, i) => (
            <div key={c.hex + i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border" style={{ backgroundColor: c.hex }} />
              <div className="text-sm">
                <p className="font-semibold">{c.name || `Color ${i + 1}`}</p>
                <p className="text-secondary">{c.code || c.hex} • {c.count} beads</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-3">Step-by-Step Guide</h2>
        <ol className="list-decimal list-inside space-y-2">
          {pattern.steps.map((step, i) => (
            <li key={i} className="text-secondary">{step}</li>
          ))}
        </ol>
      </div>
      <div className="mt-8 text-center text-xs text-secondary">
        Generated by BeadPatternAI • beadpatternai.com
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <div className="space-y-2">
          <nav className="text-secondary font-body-md text-sm">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/category/animals" className="hover:text-primary">Patterns</Link>
            <span className="mx-2">/</span>
            <span className="text-primary">{pattern.title}</span>
          </nav>
          <h1 className="font-display-lg text-display-lg-mobile text-primary">{pattern.title}</h1>
          <p className="text-secondary font-body-lg">A kawaii Perler bead pattern featuring a tiny {pattern.title.split(" ")[0].toLowerCase()} design.</p>
        </div>

        <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
          <div className="flex border-b border-secondary-container">
            {["Finished Photo", "Pattern", "Color Chart", "Guide"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 font-label-sm transition-colors ${
                  activeTab === tab ? "bg-primary-container text-white" : "text-secondary hover:bg-surface-container"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-10">
            {activeTab === "Pattern" && (
              <div className="flex justify-center">
                <div className="bg-surface-container p-4 rounded-xl inline-block">
                  {patternGrid ? (
                    <div dangerouslySetInnerHTML={{ __html: patternGrid.svg }} />
                  ) : (
                    <BeadRenderer
                      grid={undefined}
                      palette={pattern.colorPalette}
                      width={400}
                      height={400}
                      title={pattern.title}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === "Color Chart" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pattern.palette.map((c, i) => (
                  <div key={c.hex + i} className="flex items-center gap-4 p-3 bg-surface-container rounded-lg">
                    <div className="w-12 h-12 rounded-lg border border-secondary" style={{ backgroundColor: c.hex }} />
                    <div className="flex-1">
                      <p className="font-label-sm">{c.name || `Color ${i + 1}`}</p>
                      <p className="text-secondary text-sm">Code: {c.code || c.hex} • {c.count} beads</p>
                    </div>
                    <span className="font-mono text-sm text-secondary">{c.hex}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Finished Photo" && (
              <div className="text-center">
                {finishedImage?.type === "image" ? (
                  <img
                    data-print-finished
                    className="w-full max-w-lg mx-auto rounded-xl"
                    alt={`Finished perler bead ${pattern.title}`}
                    src={pattern.finished}
                  />
                ) : (
                  <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: finishedImage?.svg || "" }} />
                  </div>
                )}
                <p className="mt-4 text-secondary">Example finished project using the bead template above.</p>
              </div>
            )}

            {activeTab === "Guide" && (
              <ol className="space-y-3 list-decimal list-inside">
                {pattern.steps.map((step, i) => (
                  <li key={i} className="font-body-md text-secondary">{step}</li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
          <h2 className="font-headline-md text-headline-md mb-4">About This Pattern</h2>
          <div className="text-secondary space-y-4 font-body-md">
            <p>
              This <strong>{pattern.title}</strong> Perler bead pattern is perfect for beginners and experienced crafters alike. The design uses a limited palette, making it easy to source beads and quick to assemble.
            </p>
            <p>
              The finished project measures approximately 8x8 inches when using standard 5mm Perler beads. You can also scale down to mini beads for a smaller charm or keychain.
            </p>
            <p>
              Whether you&apos;re decorating a craft room, making a gift for a friend, or building your kawaii portfolio, this template is a great addition to your collection.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
          <h2 className="font-headline-md text-headline-md mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                What bead brand should I use?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">This pattern is optimized for Perler 5mm beads. You can also use Hama or Artkal beads with the same color codes.</p>
            </details>
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                Is the thread count included in the PDF?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">Yes! The downloadable PDF includes a full bead legend, row-by-row word chart, and a high-resolution visual grid.</p>
            </details>
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                Can I generate custom variations?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">Yes. Use the AI Pattern Generator to describe a new idea and we will create a printable template in seconds.</p>
            </details>
          </div>
        </div>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-secondary-container space-y-4 sticky top-24">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{pattern.emoji}</span>
            <div>
              <p className="font-headline-md text-body-md">{pattern.title}</p>
              <p className="text-secondary text-sm">{pattern.difficulty} &bull; {pattern.grid}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-xl p-3 text-center">
              <p className="text-secondary text-[10px] uppercase tracking-wide">Grid Size</p>
              <p className="font-semibold text-on-surface text-sm">{pattern.grid}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3 text-center">
              <p className="text-secondary text-[10px] uppercase tracking-wide">Difficulty</p>
              <p className="font-semibold text-on-surface text-sm">{pattern.difficulty}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3 text-center">
              <p className="text-secondary text-[10px] uppercase tracking-wide">Beads</p>
              <p className="font-semibold text-on-surface text-sm">{pattern.beadCount.toLocaleString()}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3 text-center">
              <p className="text-secondary text-[10px] uppercase tracking-wide">Colors</p>
              <p className="font-semibold text-on-surface text-sm">{pattern.palette.length}</p>
            </div>
          </div>

          <div>
            <p className="font-label-sm text-on-surface mb-2">Palette ({pattern.palette.length} Colors)</p>
            <div className="flex flex-wrap gap-2">
              {pattern.palette.map((c) => (
                <div key={c.hex} className="w-8 h-8 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-secondary-container space-y-3">
            <SaveButton patternSlug={pattern.slug} />
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-primary text-white py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">file_download</span> Download PDF
            </button>
            <button
              onClick={handleDownloadPNG}
              className="w-full bg-primary-fixed text-on-primary-fixed py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
            >
              <span className="material-symbols-outlined">download</span> Download PNG
            </button>
          </div>
        </div>
      </aside>

      {printContent}

      <div className="lg:col-span-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-headline-md">More from This Collection</h2>
          <Link href="/category/animals" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((p) => (
            <Link key={p.slug} href={`/pattern/${p.slug}`} className="group">
              <div className="bg-white rounded-2xl p-3 border border-secondary-container hover:-translate-y-1 transition-transform">
                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container">
                  {relatedImages[p.slug]?.type === "svg" ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: relatedImages[p.slug]!.svg || "" }} />
                  ) : relatedImages[p.slug]?.type === "image" ? (
                    <img className="w-full h-full object-cover" alt={p.title} src={relatedImages[p.slug]!.src} />
                  ) : (
                    <div className="w-full h-full bg-surface-container" />
                  )}
                </div>
                <p className="font-label-sm truncate">{p.title}</p>
                <p className="text-secondary text-sm">{p.difficulty} &bull; {p.beadCount.toLocaleString()} beads</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
