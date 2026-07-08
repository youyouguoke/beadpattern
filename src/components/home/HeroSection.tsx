"use client";

import { useEffect, useState } from "react";
import HeroSearch from "./HeroSearch";
import HeroCta from "./HeroCta";
import HeroTrending from "./HeroTrending";
import HeroPreview from "./HeroPreview";
import HeroPopular from "./HeroPopular";

const rotatingPlaceholders = ["Cute Frog", "Christmas Tree", "Ghost", "Panda", "Flower"];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % rotatingPlaceholders.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative px-4 md:px-12 lg:px-16 py-12 md:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fffdfb] via-[#fff8f9] to-[#fff4f6]" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-6 lg:space-y-7">
          <h1 className="font-display-lg text-[1.85rem] sm:text-[2.1rem] md:text-[2.5rem] lg:text-[2.85rem] text-primary-container leading-[1.08] tracking-tight text-center lg:text-left">
            Discover Printable
            <br />
            Perler Bead Patterns
          </h1>

          <p className="font-body-lg text-base md:text-lg text-secondary max-w-md text-center lg:text-left">
            Search thousands of free printable bead patterns or create your own with AI.
          </p>

          <HeroSearch
            rotatingPlaceholders={rotatingPlaceholders}
            placeholderIndex={placeholderIndex}
            value={query}
            onChange={setQuery}
          />

          <HeroCta />

          <HeroTrending />
        </div>

        <HeroPreview activeIndex={active} onSelect={setActive} />
      </div>

      <HeroPopular />
    </section>
  );
}
