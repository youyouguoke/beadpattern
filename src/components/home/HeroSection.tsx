"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { getPattern, Pattern as ServicePattern } from "@/lib/patternService";
import { getPatternImage } from "@/components/BeadRenderer";

const showcasePatterns = [
  {
    title: "Cute Frog",
    slug: "cute-frog",
    emoji: "🐸",
    grid: "32×32",
    colors: 12,
    beads: 842,
    difficulty: "Easy",
    downloads: "1.2k",
    palette: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#48DBFB", "#FFFFFF", "#161D1F"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
  },
  {
    title: "Halloween Ghost",
    slug: "ghost-pattern",
    emoji: "👻",
    grid: "16×16",
    colors: 5,
    beads: 198,
    difficulty: "Easy",
    downloads: "3.1k",
    palette: ["#FFFFFF", "#161D1F", "#FF6B6B", "#FFB7B2", "#FFD6E0"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
  },
  {
    title: "Panda Ramen",
    slug: "panda-ramen",
    emoji: "🐼",
    grid: "24×24",
    colors: 8,
    beads: 412,
    difficulty: "Medium",
    downloads: "920",
    palette: ["#FFFFFF", "#161D1F", "#F4A261", "#2A9D8F", "#E76F51"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
  },
  {
    title: "Bubble Tea Duck",
    slug: "bubble-tea-duck",
    emoji: "🦆",
    grid: "24×24",
    colors: 7,
    beads: 356,
    difficulty: "Easy",
    downloads: "2.9k",
    palette: ["#F7D794", "#F4A261", "#48DBFB", "#FFFFFF", "#FFB7B2"],
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
  },
];

const trendingSearches = ["frog", "ghost", "flower", "christmas", "food", "pokemon inspired"];
const trendingTerms = [
  { emoji: "🐸", label: "frog" },
  { emoji: "👻", label: "ghost" },
  { emoji: "🌸", label: "flower" },
  { emoji: "🎄", label: "christmas" },
  { emoji: "🍔", label: "food" },
  { emoji: "🎮", label: "pokemon inspired" },
];

const suggestions = [
  "frog", "frog flower", "frog christmas", "frog pixel art",
  "ghost", "ghost cute", "ghost halloween",
  "flower", "flower pot", "flower bouquet",
  "christmas", "christmas tree", "christmas penguin",
  "food", "food kawaii", "food sushi",
  "pokemon inspired", "pokemon pikachu", "pokemon eevee",
];

const popularSearches = [
  { emoji: "🐸", label: "frog" },
  { emoji: "🐱", label: "cat" },
  { emoji: "👻", label: "ghost" },
  { emoji: "🎮", label: "pokemon" },
  { emoji: "🌸", label: "flower" },
  { emoji: "🍔", label: "food" },
  { emoji: "🎌", label: "anime" },
  { emoji: "💖", label: "kawaii" },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [patterns, setPatterns] = useState<ServicePattern[]>([]);
  const [patternImages, setPatternImages] = useState<Record<string, { type: "image" | "svg"; src: string; svg?: string }>>({});

  useEffect(() => {
    Promise.all(showcasePatterns.map((p) => getPattern(p.slug))).then((fetched) => {
      const merged: ServicePattern[] = [];
      for (let i = 0; i < showcasePatterns.length; i++) {
        const mock = showcasePatterns[i];
        const real = fetched[i];
        merged.push(
          real || {
            slug: mock.slug,
            title: mock.title,
            emoji: mock.emoji,
            img: mock.src,
            finished: mock.src,
            difficulty: mock.difficulty as ServicePattern["difficulty"],
            grid: mock.grid.replace("×", "x"),
            colors: mock.colors,
            beadCount: mock.beads,
            downloads: mock.downloads,
            palette: mock.palette.map((hex) => ({ hex, name: "", count: 0, code: "" })),
            steps: [],
            related: [],
          }
        );
      }
      setPatterns(merged);
      const imgMap: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
      for (const p of merged) {
        imgMap[p.slug] = getPatternImage(p, { width: 512, height: 512, preferGrid: true });
      }
      setPatternImages(imgMap);
    });
  }, []);

  const activeMock = showcasePatterns[active];
  const activePattern = patterns[active] || activeMock;
  const activeImage = patternImages[activeMock?.slug] || { type: "image", src: activeMock?.src };

  const activePalette = Array.isArray(activePattern?.palette)
    ? activePattern.palette
    : activeMock?.palette.map((hex) => ({ hex, name: "", count: 0, code: "" })) || [];

  const rotatingPlaceholders = ["Cute Frog", "Ghost", "Flower", "Pokemon", "Christmas"];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % showcasePatterns.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % rotatingPlaceholders.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filteredSuggestions = query.trim()
    ? suggestions.filter((s) => s.toLowerCase().startsWith(query.toLowerCase())).slice(0, 6)
    : [];

  const searchLink = `/search?q=${encodeURIComponent(query || rotatingPlaceholders[placeholderIndex])}`;

  return (
    <section className="relative px-4 md:px-12 lg:px-16 py-12 md:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fffdfb] via-[#fff8f9] to-[#fff4f6]" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Search-first Hero */}
        <div className="space-y-6 lg:space-y-7">
          <h1 className="font-display-lg text-[1.85rem] sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem] text-primary-container leading-[1.08] tracking-tight text-center lg:text-left">
            Discover Printable
            <br />
            Perler Bead Patterns
          </h1>

          <p className="font-body-lg text-base md:text-lg text-secondary max-w-md text-center lg:text-left">
            Search thousands of free printable bead patterns or create your own with AI.
          </p>

          <div ref={wrapRef} className="relative w-full max-w-lg mx-auto lg:mx-0">
            <div className="w-full bg-white rounded-2xl p-2 bead-shadow border-2 border-secondary-container flex flex-col md:flex-row gap-2 items-center">
              <div className="flex-1 flex items-center px-3 md:px-4 w-full h-12 md:h-13">
                <span className="material-symbols-outlined text-primary mr-2">search</span>
                <input
                  ref={inputRef}
                  className="w-full border-none focus:ring-0 text-base placeholder:text-outline italic bg-transparent outline-none"
                  placeholder={`Try "${rotatingPlaceholders[placeholderIndex]}"`}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      window.location.href = searchLink;
                    }
                  }}
                />
              </div>
              <Link
                href={searchLink}
                className="w-full md:w-auto shrink-0 bg-primary-container text-white px-6 py-3 rounded-xl font-headline-md text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
              >
                Browse Patterns
              </Link>
            </div>

            {showSuggestions && (query.trim() || filteredSuggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-secondary-container shadow-xl p-2 z-30">
                {query.trim() ? (
                  <>
                    <p className="px-3 py-2 text-xs text-secondary uppercase tracking-wide">Suggestions</p>
                    {filteredSuggestions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-secondary">No matches. Try AI generate.</p>
                    ) : (
                      filteredSuggestions.map((s) => (
                        <Link
                          key={s}
                          href={`/search?q=${encodeURIComponent(s)}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container text-sm text-on-surface"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <span className="material-symbols-outlined text-secondary">search</span>
                          {s}
                        </Link>
                      ))
                    )}
                  </>
                ) : null}

                <p className="px-3 py-2 text-xs text-secondary uppercase tracking-wide">Trending Searches</p>
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {trendingSearches.map((s) => (
                    <Link
                      key={s}
                      href={`/search?q=${encodeURIComponent(s)}`}
                      className="text-sm px-3 py-1.5 rounded-full bg-surface-container text-secondary hover:bg-primary-container hover:text-white transition-colors"
                      onClick={() => setShowSuggestions(false)}
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/category/animals"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-white text-sm font-medium hover:bg-primary transition-colors"
            >
              Browse Patterns
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-secondary-container text-secondary text-sm font-medium hover:bg-surface-container transition-colors"
            >
              Create with AI
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-secondary text-center lg:text-left">Trending Searches</p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {trendingTerms.map((t) => (
                <Link
                  key={t.label}
                  href={`/search?q=${encodeURIComponent(t.label)}`}
                  className="text-sm px-3 py-1.5 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors"
                >
                  {t.emoji} {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Preview Card */}
        <div className="space-y-4 lg:space-y-5">
          <div className="bg-white rounded-3xl p-5 md:p-6 bead-shadow border border-secondary-container">
            <div className="mb-5">
              <h3 className="font-headline-md text-base text-primary">Live Pattern Preview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                className="rounded-2xl overflow-hidden border border-secondary-container relative aspect-square"
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

              <div className="flex flex-col justify-between py-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-4xl mb-2">{activePattern.emoji}</p>
                    <h4 className="font-headline-md text-2xl text-on-surface">{activePattern.title}</h4>
                    <p className="text-sm text-secondary mt-1">Downloaded {activePattern.downloads} times</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Grid</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.grid}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Colors</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.colors}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Beads</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.beadCount}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl px-1 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Level</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.difficulty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activePalette.slice(0, 6).map((c) => (
                      <div key={c.hex} className="w-8 h-8 rounded-lg border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                    ))}
                    {activePalette.length > 6 && (
                      <span className="text-xs text-secondary">+{activePalette.length - 6}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/pattern/${activePattern.slug}?tab=finished-photo`}
                  className="w-full mt-5 bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download PDF
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {showcasePatterns.map((p, i) => (
              <button
                key={p.title}
                onClick={() => setActive(i)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border-2 transition-colors text-xs md:text-sm truncate ${
                  active === i
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
      </div>

      {/* Popular searches */}
      <div className="max-w-7xl mx-auto mt-10 md:mt-14">
        <div className="flex flex-col items-center lg:items-start gap-2">
          <span className="text-sm text-secondary">Popular Searches</span>
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3">
            {popularSearches.map((term) => (
              <Link
                key={term.label}
                href={`/search?q=${encodeURIComponent(term.label)}`}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors"
              >
                <span className="text-base">{term.emoji}</span>
                {term.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
