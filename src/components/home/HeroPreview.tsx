"use client";

import { getPatternBySlug, Pattern } from "@/lib/publicApiService";
import { getPatternImage } from "@/components/BeadRenderer";
import { useEffect, useState } from "react";

const showcasePatterns = [
  {
    title: "Cute Frog",
    slug: "cute-frog",
    emoji: "🐸",
    gridSize: "32x32",
    colorCount: 12,
    estimatedBeads: 842,
    difficulty: "easy",
    downloads: 1200,
    palette: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#48DBFB", "#FFFFFF", "#161D1F"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
  },
  {
    title: "Halloween Ghost",
    slug: "ghost-pattern",
    emoji: "👻",
    gridSize: "16x16",
    colorCount: 5,
    estimatedBeads: 198,
    difficulty: "easy",
    downloads: 3100,
    palette: ["#FFFFFF", "#161D1F", "#FF6B6B", "#FFB7B2", "#FFD6E0"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
  },
  {
    title: "Panda Ramen",
    slug: "panda-ramen",
    emoji: "🐼",
    gridSize: "24x24",
    colorCount: 8,
    estimatedBeads: 412,
    difficulty: "medium",
    downloads: 920,
    palette: ["#FFFFFF", "#161D1F", "#F4A261", "#2A9D8F", "#E76F51"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
  },
  {
    title: "Bubble Tea Duck",
    slug: "bubble-tea-duck",
    emoji: "🦆",
    gridSize: "24x24",
    colorCount: 7,
    estimatedBeads: 356,
    difficulty: "easy",
    downloads: 2900,
    palette: ["#F7D794", "#F4A261", "#48DBFB", "#FFFFFF", "#FFB7B2"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
  },
];

export interface HeroPreviewProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

function difficultyLabel(diff: string) {
  return diff ? diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase() : "";
}

export default function HeroPreview({ activeIndex, onSelect }: HeroPreviewProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [images, setImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    Promise.all(showcasePatterns.map((p) => getPatternBySlug(p.slug))).then((fetched) => {
      const merged: Pattern[] = [];
      for (let i = 0; i < showcasePatterns.length; i++) {
        const mock = showcasePatterns[i];
        const real = fetched[i];
        if (real) {
          merged.push(real);
        } else {
          merged.push({
            id: mock.slug,
            slug: mock.slug,
            title: mock.title,
            emoji: mock.emoji,
            difficulty: mock.difficulty as Pattern["difficulty"],
            gridSize: mock.gridSize,
            colorCount: mock.colorCount,
            estimatedBeads: mock.estimatedBeads,
            downloads: mock.downloads,
            colorPalette: mock.palette.map((hex) => ({ hex, name: "", count: 0, code: "" })),
            coverImage: mock.src,
            finishedImage: mock.src,
            status: "published",
            version: 1,
            createdAt: "",
            updatedAt: "",
            description: "",
            seoTitle: "",
            seoDescription: "",
            seoKeywords: "",
            subject: "",
            style: "",
            season: "",
            estimatedTime: "",
            gridStatus: "missing",
            gridDesigner: "",
            gridVersion: 1,
            gridReviewRequired: false,
            seoPriority: 0,
            publishOrder: 0,
          });
        }
      }
      setPatterns(merged);
      const imgMap: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of merged) {
        imgMap[p.slug] = getPatternImage(p, { width: 512, height: 512, preferGrid: true });
      }
      setImages(imgMap);
    });
  }, []);

  const activeMock = showcasePatterns[activeIndex];
  const activePattern = patterns[activeIndex] || ({
    ...activeMock,
    id: activeMock?.slug,
    status: "published",
    version: 1,
    createdAt: "",
    updatedAt: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    subject: "",
    style: "",
    season: "",
    estimatedTime: "",
    gridStatus: "missing",
    gridDesigner: "",
    gridVersion: 1,
    gridReviewRequired: false,
    seoPriority: 0,
    publishOrder: 0,
  } as unknown as Pattern);
  const activeImage = images[activeMock?.slug] || { type: "image", src: activeMock?.src };

  const activePalette: { hex: string }[] = activePattern?.colorPalette?.length
    ? activePattern.colorPalette
    : activeMock?.palette.map((hex) => ({ hex, name: "", count: 0, code: "" })) || [];

  const downloadsDisplay = activePattern.downloads
    ? activePattern.downloads >= 1000
      ? `${(activePattern.downloads / 1000).toFixed(1)}k`
      : String(activePattern.downloads)
    : activeMock?.downloads
    ? activeMock.downloads >= 1000
      ? `${(activeMock.downloads / 1000).toFixed(1)}k`
      : String(activeMock.downloads)
    : "0";

  return (
    <div className="w-full max-w-[560px] xl:max-w-[600px] mx-auto lg:ml-auto space-y-4">
      <div className="bg-white rounded-[2rem] p-5 md:p-6 bead-shadow border border-secondary-container">
        <div className="mb-4">
          <h3 className="font-headline-md text-base text-primary">Live Pattern Preview</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <div
            className="shrink-0 w-full sm:w-[240px] md:w-[260px] rounded-2xl overflow-hidden border border-secondary-container aspect-square"
            style={{
              backgroundColor: "#faf7f5",
              backgroundImage:
                "linear-gradient(rgba(231, 222, 218, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(231, 222, 218, 0.35) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            {activeImage.type === "svg" ? (
              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: activeImage.svg || "" }} />
            ) : (
              <img className="w-full h-full object-cover" alt={activePattern.title} src={activeImage.src} />
            )}
          </div>

          <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
            <div className="space-y-4">
              <div>
                <p className="text-3xl mb-1">{activePattern.emoji}</p>
                <h4 className="font-headline-md text-xl md:text-2xl text-on-surface truncate">{activePattern.title}</h4>
                <p className="text-sm text-secondary mt-1">Downloaded {downloadsDisplay} times</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                  <p className="text-secondary text-[10px] uppercase tracking-wide">Grid</p>
                  <p className="font-semibold text-on-surface text-xs">{activePattern.gridSize}</p>
                </div>
                <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                  <p className="text-secondary text-[10px] uppercase tracking-wide">Colors</p>
                  <p className="font-semibold text-on-surface text-xs">{activePattern.colorCount}</p>
                </div>
                <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                  <p className="text-secondary text-[10px] uppercase tracking-wide">Beads</p>
                  <p className="font-semibold text-on-surface text-xs">{activePattern.estimatedBeads}</p>
                </div>
                <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                  <p className="text-secondary text-[10px] uppercase tracking-wide">Level</p>
                  <p className="font-semibold text-on-surface text-xs">{difficultyLabel(activePattern.difficulty)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activePalette.slice(0, 6).map((c) => (
                  <div key={c.hex} className="w-7 h-7 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                ))}
                {activePalette.length > 6 && (
                  <span className="text-xs text-secondary">+{activePalette.length - 6}</span>
                )}
              </div>
            </div>
            <a
              href={`/pattern/${activePattern.slug}`}
              className="w-full mt-5 bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
            >
              <span className="material-symbols-outlined">download</span>
              Download PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {showcasePatterns.map((p, i) => (
          <button
            key={p.title}
            onClick={() => onSelect(i)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border-2 transition-colors text-xs md:text-sm truncate ${
              activeIndex === i
                ? "border-primary-container bg-primary-container/10 text-primary"
                : "border-secondary-container bg-white text-secondary hover:border-primary-container"
            }`}
          >
            <span className="text-base">{p.emoji}</span>
            <span className="font-medium truncate">{p.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
