"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface PatternDetailProps {
  params: Promise<{ slug: string }>;
}

const allPatterns: Record<string, { title: string; palette: { hex: string; name: string; count: number; code: string }[]; steps: string[]; related: { title: string; beads: number }[]; finished: string; }> = {
  "cute-frog": {
    title: "Cute Frog Drinking Bubble Tea",
    palette: [
      { hex: "#2D6A4F", name: "Emerald Green", count: 124, code: "A5" },
      { hex: "#40916C", name: "Pond Green", count: 86, code: "B23" },
      { hex: "#52B788", name: "Minty Green", count: 52, code: "C12" },
      { hex: "#74C69D", name: "Pale Green", count: 38, code: "D4" },
      { hex: "#48DBFB", name: "Bubble Blue", count: 24, code: "E18" },
      { hex: "#FFFFFF", name: "White Pearl", count: 18, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 10, code: "G10" },
    ],
    steps: [
      "Start with the outer outline of the frog in Emerald Green (#A5).",
      "Fill the body with Pond Green (#B23), leaving the belly white (#F01).",
      "Add the bubble tea cup with Bubble Blue (#E18) and a white pearl highlight.",
      "Use Minty Green (#C12) for shading on the cheeks and limbs.",
      "Finish with the black (#G10) eyes and a small pink blush if desired.",
    ],
    related: [
      { title: "Kawaii Cat", beads: 320 },
      { title: "Space Rocket", beads: 410 },
      { title: "Strawberry Bear", beads: 280 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
  },
  "kawaii-cat": {
    title: "Kawaii Cat",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 100, code: "F01" },
      { hex: "#FFB7B2", name: "Pink", count: 45, code: "P12" },
      { hex: "#161D1F", name: "Black", count: 20, code: "G10" },
      { hex: "#F7D794", name: "Yellow", count: 10, code: "Y3" },
    ],
    steps: [
      "Outline the cat head in White (#F01).",
      "Fill ears and cheeks with Pink (#P12).",
      "Add black eyes and whiskers (#G10).",
      "Finish with small yellow nose (#Y3).",
    ],
    related: [
      { title: "Cute Frog", beads: 352 },
      { title: "Strawberry Bear", beads: 280 },
      { title: "Pixel Bunny", beads: 330 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoB35YtssNgeEtVQIX9I1WEk90aEVlmll9NmIITg8ow7ynWIsHRD3d9YegPvDM7pOWBEMqszJr4-yqlrTrVVTQjJ9fq8ciKbL4GFeJ_ctUC7IwFbOjt9QWVTltQfpnSKbF3t7h39EHtkmVUdK1mSe5r9OwKpkAJVpohIH3mtlJkA5myETC55EmqPq9otyDhNmETrqi9CqSzxHn7X3eUBytBF8Mkzk_b8vKKrCGJ0tJXaqZFv7-gyNfhcZh5eumAcCIQjoYxaZt1oI",
  },
  "ghost-pattern": {
    title: "Ghost Pattern",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 120, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 16, code: "G10" },
      { hex: "#FF6B6B", name: "Red", count: 8, code: "R5" },
    ],
    steps: [
      "Shape the ghost body in White (#F01).",
      "Add oval black eyes (#G10).",
      "Draw a tiny red mouth (#R5).",
    ],
    related: [
      { title: "Halloween", beads: 200 },
      { title: "Cute Frog", beads: 352 },
      { title: "Kawaii Cat", beads: 320 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
  },
  "panda-ramen": {
    title: "Panda Ramen",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 180, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 90, code: "G10" },
      { hex: "#F4A261", name: "Orange", count: 40, code: "O8" },
      { hex: "#2A9D8F", name: "Teal", count: 30, code: "T6" },
    ],
    steps: [
      "Build the panda face with black ears and eye patches.",
      "Fill the ramen bowl in Orange (#O8).",
      "Add teal noodles and chopsticks.",
      "Place the panda leaning over the bowl.",
    ],
    related: [
      { title: "Food", beads: 400 },
      { title: "Cute Frog", beads: 352 },
      { title: "Bubble Tea Duck", beads: 290 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
  },
  "christmas-penguin": {
    title: "Christmas Penguin",
    palette: [
      { hex: "#161D1F", name: "Black", count: 110, code: "G10" },
      { hex: "#FFFFFF", name: "White", count: 80, code: "F01" },
      { hex: "#E63946", name: "Red", count: 40, code: "R7" },
      { hex: "#F1FAEE", name: "Ice", count: 20, code: "I2" },
    ],
    steps: [
      "Form the penguin body in Black (#G10).",
      "Add white belly and face patches.",
      "Wrap a red scarf around the neck.",
      "Set on an ice base (#I2).",
    ],
    related: [
      { title: "Christmas", beads: 350 },
      { title: "Cute Frog", beads: 352 },
      { title: "Ghost", beads: 180 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBkHrHyo-iAUDP9j17ESnZwHiue-w3UYSdio8GicjGI6ExmTQWasc2BGXVGrrJfhXNE0LOFx8uo07VJ6Z1zGg0UguT7gpVl4n8kJJJznr0jrPGPeBoe3Q8OjgtGCj-daUM3rmdLOSVEHLlx3xYxt6RQWO3xAV12OUxnVYO0nU_LIdjve6SdrGkVAnPOFgW79aOQV7cbmaUT4LfeToUp4RNIdp1eJvMtB9KnVZsFlujuYoxjkVGLDENjaIk537Z2lNboXGGeeOnPqw",
  },
  "strawberry-bear": {
    title: "Strawberry Bear",
    palette: [
      { hex: "#E63946", name: "Strawberry Red", count: 100, code: "R8" },
      { hex: "#FFB7B2", name: "Pink", count: 60, code: "P12" },
      { hex: "#FFFFFF", name: "White", count: 30, code: "F01" },
      { hex: "#2D6A4F", name: "Green", count: 20, code: "A5" },
    ],
    steps: [
      "Shape the strawberry body in Red (#R8).",
      "Add a cute bear face with Pink cheeks.",
      "Place white seeds across the body.",
      "Top with green leaves (#A5).",
    ],
    related: [
      { title: "Food", beads: 300 },
      { title: "Kawaii Cat", beads: 320 },
      { title: "Cute Frog", beads: 352 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlponKu8fvQ9RawvPCBHNOC_O6vluHp3x_PgyanO_QfJGmpnJMsHW8n0jFGy-QF1NcZRqv2-S0fKRBC9ZOcntzHEDQhfTJ7Ns8lFxLFOVTl-jkX5f7i6g49aUs0_S9cOx_953VCppCwoNe_z1wOn72pVFApNPA544CAM_opu5eczuADofDRsX-pZSlVtEwDkIBe8TP8LdXeRWk7AkqGcVh7J65PiFKyA2nVyQPcMvvo3nddOihT4LjDJHAhzIX9omrKZP9fYRixbw",
  },
  "pixel-bunny": {
    title: "Pixel Bunny",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 140, code: "F01" },
      { hex: "#FFB7B2", name: "Pink", count: 50, code: "P12" },
      { hex: "#161D1F", name: "Black", count: 18, code: "G10" },
    ],
    steps: [
      "Outline the bunny body in White (#F01).",
      "Add long ears and pink inner ears.",
      "Draw black eyes and nose.",
    ],
    related: [
      { title: "Animals", beads: 300 },
      { title: "Cute Frog", beads: 352 },
      { title: "Kawaii Cat", beads: 320 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxoYk69P9StN6wav9jZOzxbN3tooGoa8NBNY6dVjlSqxymcjfGByFd1U5exFJrBUsibmRYhOr2j102EcgExO0BAFk74xnzhq4XkIEx7KfW3KpoEoG2N7e1JcTql3AMAkKYfXhpmJqFoyvLvA1nlugjqTFoz1OG-IzV7z2ZxhzzzNm9IYeZVpQCvqyhVDmqYMBhuP8EyE7WJ0TZ_pwIIpDA_uZw9ZDyctW69HwQVA_TfkjqIbsHKWKoX6lnbDhykWATqbAoZ_RObWs",
  },
  "bubble-tea-duck": {
    title: "Bubble Tea Duck",
    palette: [
      { hex: "#F7D794", name: "Yellow", count: 120, code: "Y3" },
      { hex: "#F4A261", name: "Orange", count: 40, code: "O8" },
      { hex: "#48DBFB", name: "Bubble Blue", count: 30, code: "E18" },
      { hex: "#FFFFFF", name: "White", count: 20, code: "F01" },
    ],
    steps: [
      "Shape the duck body in Yellow (#Y3).",
      "Add an orange beak and feet.",
      "Place a blue bubble tea cup beside it.",
      "Add white highlights.",
    ],
    related: [
      { title: "Food", beads: 250 },
      { title: "Cute Frog", beads: 352 },
      { title: "Kawaii Cat", beads: 320 },
    ],
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
  },
};

export default function PatternDetail({ params }: PatternDetailProps) {
  const [activeTab, setActiveTab] = useState("Pattern");
  const [slug, setSlug] = useState<string>("cute-frog");
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => setSlug(p.slug || "cute-frog"));
  }, [params]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "finished-photo") {
      setActiveTab("Finished Photo");
    }
  }, [searchParams]);

  const pattern = allPatterns[slug] || allPatterns["cute-frog"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-2">
          <nav className="text-secondary font-body-md">
            <span className="hover:text-primary cursor-pointer">Home</span> / <span className="hover:text-primary cursor-pointer">Patterns</span> / <span className="text-primary">{pattern.title}</span>
          </nav>
          <h1 className="font-display-lg text-display-lg-mobile text-primary">{pattern.title}</h1>
          <p className="text-secondary font-body-lg">A kawaii Perler bead pattern featuring a tiny {pattern.title.split(" ")[0].toLowerCase()} design.</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-secondary-container overflow-hidden">
          <div className="flex border-b border-secondary-container">
            {["Pattern", "Color Chart", "Finished Photo", "Guide"].map((tab) => (
              <button
                key={tab}
                data-tab={tab}
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

        <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-secondary-container">
          <h2 className="font-headline-md text-headline-md mb-4">About This Pattern</h2>
          <div className="prose-pink text-secondary space-y-4 font-body-md">
            <p>
              This <strong>{pattern.title}</strong> perler bead pattern is perfect for beginners and experienced crafters alike. The design uses a limited palette, making it easy to source beads and quick to assemble.
            </p>
            <p>
              The finished project measures approximately 8x8 inches when using standard 5mm Perler beads. You can also scale down to mini beads for a smaller charm or keychain.
            </p>
            <p>
              Whether you&apos;re decorating a craft room, making a gift for a friend, or building your kawaii portfolio, this template is a great addition to your collection.
            </p>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border-2 border-secondary-container space-y-4 sticky top-24">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white font-display-lg">
              {pattern.palette.reduce((sum, c) => sum + c.count, 0)}
            </div>
            <div>
              <p className="font-label-sm">Total Beads</p>
              <p className="text-secondary text-sm">16 x 16 grid</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-white font-display-lg">
              {pattern.palette.length}
            </div>
            <div>
              <p className="font-label-sm">Colors</p>
              <p className="text-secondary text-sm">Easy palette</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary font-display-lg">
              1h
            </div>
            <div>
              <p className="font-label-sm">Estimated Time</p>
              <p className="text-secondary text-sm">Beginner friendly</p>
            </div>
          </div>

          <div className="pt-4 border-t border-secondary-container space-y-3">
            <button
              onClick={() => {
                const activeTabBtn = document.querySelector('[data-tab="Finished Photo"]') as HTMLButtonElement | null;
                if (activeTabBtn) activeTabBtn.click();

                setTimeout(() => {
                  const finishedImg = document.querySelector('[data-print-finished]') as HTMLImageElement | null;
                  if (finishedImg && finishedImg.src) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>${pattern.title} - BeadPatternAI</title>
                            <style>
                              @media print {
                                body { margin: 0; }
                                img { max-width: 100%; height: auto; page-break-inside: avoid; }
                              }
                              body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; padding: 24px; box-sizing: border-box; }
                              img { max-width: 100%; max-height: 100vh; height: auto; object-fit: contain; }
                            </style>
                          </head>
                          <body>
                            <img src="${finishedImg.src}" alt="Finished bead pattern" />
                            <script>window.onload = function() { setTimeout(function() { window.print(); }, 200); };</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }, 100);
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">file_download</span> Download PDF
            </button>
            <button className="w-full bg-secondary-container text-primary py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
              <span className="material-symbols-outlined">favorite</span> Save to Collection
            </button>
            <button className="w-full bg-surface-container text-secondary py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors">
              <span className="material-symbols-outlined">share</span> Share Pattern
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-secondary-container">
          <h3 className="font-headline-md text-body-md mb-4">You Might Also Like</h3>
          <div className="space-y-3">
            {pattern.related.map((p) => (
              <div key={p.title} className="p-3 rounded-lg bg-surface-container hover:bg-secondary-container transition-colors cursor-pointer">
                <p className="font-label-sm">{p.title}</p>
                <p className="text-secondary text-sm">{p.beads} beads</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
