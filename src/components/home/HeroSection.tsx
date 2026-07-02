"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const showcasePatterns = [
  {
    title: "Cute Frog",
    emoji: "🐸",
    rating: 5,
    grid: "32×32",
    colors: 12,
    beads: 842,
    downloads: "2.4k",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
  },
  {
    title: "Halloween Ghost",
    emoji: "👻",
    rating: 5,
    grid: "16×16",
    colors: 5,
    beads: 198,
    downloads: "3.1k",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
  },
  {
    title: "Panda Ramen",
    emoji: "🐼",
    rating: 4,
    grid: "24×24",
    colors: 8,
    beads: 412,
    downloads: "1.8k",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
  },
  {
    title: "Bubble Tea Duck",
    emoji: "🦆",
    rating: 5,
    grid: "24×24",
    colors: 7,
    beads: 356,
    downloads: "2.9k",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
  },
];

const trendingPrompts = [
  { emoji: "🔥", label: "Cute Frog" },
  { emoji: "🎃", label: "Halloween Ghost" },
  { emoji: "🎄", label: "Christmas Tree" },
  { emoji: "🍓", label: "Strawberry Bear" },
  { emoji: "🐼", label: "Panda Ramen" },
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

const trustBadges = [
  "Free PDF",
  "Instant",
  "AI Generated",
  "Printable",
  "No Login",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="material-symbols-outlined text-sm">
          {i < rating ? "star" : "star_border"}
        </span>
      ))}
    </div>
  );
}

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [prompt, setPrompt] = useState("cute frog drinking bubble tea");

  const activePattern = showcasePatterns[active];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % showcasePatterns.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative px-4 md:px-12 lg:px-16 py-10 md:py-16 lg:py-20 overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fffdfb] via-[#fff8f9] to-[#fff4f6]" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: prompt + CTAs */}
        <div className="space-y-5 lg:space-y-6 pt-2 lg:pt-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-white/80 border border-secondary-container/40 px-2.5 py-1 rounded-full"
              >
                <span className="material-symbols-outlined text-sm text-primary">verified</span>
                {badge}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <h1 className="font-display-lg text-[1.75rem] sm:text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] text-primary-container leading-[1.1] tracking-tight text-center lg:text-left">
              Generate Printable
              <br />
              Perler Bead Patterns with AI
            </h1>
          </div>

          <p className="font-body-lg text-base md:text-lg text-secondary max-w-md text-center lg:text-left">
            Turn any idea into printable bead templates.
            <br />
            Perfect for DIY, Perler, Hama and Pixel Art lovers.
          </p>

          <div className="w-full max-w-md bg-white rounded-2xl p-2 bead-shadow border-2 border-secondary-container flex flex-col md:flex-row gap-2 items-center mx-auto lg:mx-0">
            <div className="flex-1 flex items-center px-3 md:px-4 w-full h-12 md:h-13">
              <span className="material-symbols-outlined text-primary mr-2">auto_awesome</span>
              <input
                className="w-full border-none focus:ring-0 text-base placeholder:text-outline italic bg-transparent outline-none"
                placeholder="cute frog drinking bubble tea"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Link
              href="/generate"
              className="w-full md:w-auto shrink-0 bg-primary-container text-white px-6 py-3 rounded-xl font-headline-md text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
            >
              Generate
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="#trending"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-primary text-sm font-medium hover:bg-primary-container hover:text-white transition-colors"
            >
              Browse 5,000+ Patterns
            </Link>
            <Link
              href="#prompt-ideas"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-secondary-container text-secondary text-sm font-medium hover:bg-surface-container transition-colors"
            >
              Get Prompt Ideas
            </Link>
          </div>

          <div className="space-y-2 mt-12">
            <p className="text-sm text-secondary text-center lg:text-left">Trending Prompts</p>
            <div className="flex flex-nowrap gap-2 justify-center lg:justify-start">
              {trendingPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPrompt(p.label.toLowerCase())}
                  className="text-sm px-3 py-1.5 rounded-full bg-white border border-secondary-container text-secondary hover:bg-primary-container hover:text-white hover:border-primary-container transition-colors whitespace-nowrap"
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live AI Preview card */}
        <div className="space-y-4 lg:space-y-5">
          <div className="bg-white rounded-3xl p-5 md:p-6 bead-shadow border border-secondary-container">
            <div className="mb-5">
              <h3 className="font-headline-md text-base text-primary">Live AI Preview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl overflow-hidden bg-surface-container border border-secondary-container">
                <img
                  className="w-full h-full object-cover"
                  alt={activePattern.title}
                  src={activePattern.src}
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-4xl mb-2">{activePattern.emoji}</p>
                    <h4 className="font-headline-md text-2xl text-on-surface">{activePattern.title}</h4>
                    <StarRating rating={activePattern.rating} />
                  </div>
                  <div className="flex flex-nowrap items-stretch gap-2 text-sm">
                    <div className="flex-1 min-w-0 bg-surface-container rounded-xl px-2 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Grid</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.grid}</p>
                    </div>
                    <div className="flex-1 min-w-0 bg-surface-container rounded-xl px-2 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Colors</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.colors}</p>
                    </div>
                    <div className="flex-1 min-w-0 bg-surface-container rounded-xl px-2 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">Beads</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.beads}</p>
                    </div>
                    <div className="flex-1 min-w-0 bg-surface-container rounded-xl px-2 py-2 text-center">
                      <p className="text-secondary text-[10px] uppercase tracking-wide">DL</p>
                      <p className="font-semibold text-on-surface text-xs">{activePattern.downloads}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`/pattern/${activePattern.title.toLowerCase().replace(/\s+/g, "-")}`, "_blank")}
                  className="w-full mt-5 bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download PDF
                </button>
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
                href={`/category/${term.label}`}
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
