"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPattern, Pattern } from "@/lib/patternService";

interface PatternDetailProps {
  params: Promise<{ slug: string }>;
}

export default function PatternDetail({ params }: PatternDetailProps) {
  const [activeTab, setActiveTab] = useState("Finished Photo");
  const [slug, setSlug] = useState<string>("cute-frog");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => {
      const s = p.slug || "cute-frog";
      setSlug(s);
      getPattern(s).then(setPattern);
    });
  }, [params]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab === "finished-photo" ? "Finished Photo" : tab);
  }, [searchParams]);

  if (!pattern) return <div className="pt-28 text-center">Loading pattern...</div>;

  const handleDownloadPNG = async () => {
    const img = document.querySelector('[data-print-finished]') as HTMLImageElement | null;
    if (!img || !img.src) return;
    try {
      const response = await fetch(img.src, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pattern.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // fallback: open image in new tab if fetch fails due to CORS / network
      window.open(img.src, '_blank');
    }
  };

  const handleDownload = () => {
    const img = document.querySelector('[data-print-finished]') as HTMLImageElement | null;
    if (img && img.src) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${pattern.title} - BeadPatternAI</title>
              <style>
                @media print { body { margin: 0; } img { max-width: 100%; height: auto; page-break-inside: avoid; } }
                body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; padding: 24px; box-sizing: border-box; }
                img { max-width: 100%; max-height: 100vh; height: auto; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${img.src}" alt="Finished bead pattern" />
              <script>window.onload = function() { setTimeout(function() { window.print(); }, 200); };</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

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
                  <div className="grid grid-cols-16 gap-px">
                    {Array.from({ length: 256 }).map((_, i) => {
                      const colorMap = pattern.palette.map((c) => c.hex).concat(["#f4fafd"]);
                      const color = colorMap[i % colorMap.length];
                      return (
                        <div key={i} className="w-4 h-4 border border-white/20" style={{ backgroundColor: color }} />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Color Chart" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pattern.palette.map((c) => (
                  <div key={c.hex} className="flex items-center gap-4 p-3 bg-surface-container rounded-lg">
                    <div className="w-12 h-12 rounded-lg border border-secondary" style={{ backgroundColor: c.hex }} />
                    <div className="flex-1">
                      <p className="font-label-sm">{c.name}</p>
                      <p className="text-secondary text-sm">Code: {c.code} &bull; {c.count} beads</p>
                    </div>
                    <span className="font-mono text-sm text-secondary">{c.hex}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Finished Photo" && (
              <div className="text-center">
                <img
                  data-print-finished
                  className="w-full max-w-lg mx-auto rounded-xl"
                  alt={`Finished perler bead ${pattern.title}`}
                  src={pattern.finished}
                />
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
            <button
              onClick={handleDownload}
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
            <button className="w-full bg-surface-container text-secondary py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors">
              <span className="material-symbols-outlined">favorite</span> Save
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-headline-md">More from This Collection</h2>
          <Link href="/category/animals" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pattern.related.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-3 border border-secondary-container hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="aspect-square rounded-xl bg-surface-container mb-3" />
              <p className="font-label-sm">{p.title}</p>
              <p className="text-secondary text-sm">{p.difficulty} &bull; {p.beads} beads</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
