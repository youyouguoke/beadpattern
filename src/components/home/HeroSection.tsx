"use client";

import Link from "next/link";

const heroImages = {
  hero: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-cat.png?v=2",
  panda: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/detailed-panda.png?v=2",
  food: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cupcake-cherry.png?v=2",
  collage: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-fox.png?v=2",
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface-container-lowest">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl -z-0" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl -z-0" />

      <div className="container-main relative z-10 pt-16 pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: copy */}
          <div className="lg:w-1/2 space-y-stack-md">
            <h1 className="font-quicksand text-headline-xl text-primary max-w-md">
              Cute Perler Bead Patterns
            </h1>

            <p className="font-plus-jakarta text-body-lg text-on-surface-variant max-w-lg">
              Discover printable fuse bead patterns for animals, food, kawaii characters and pixel art. Join our community of makers today.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/patterns"
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Browse Patterns
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                href="/collections"
                className="border-2 border-primary text-primary px-8 py-4 rounded-full font-label-md hover:bg-primary/5 transition-all"
              >
                Explore Collections
              </Link>
            </div>
          </div>

          {/* Right: Pinterest-style collage */}
          <div className="lg:w-1/2 w-full">
            <div className="grid grid-cols-3 gap-4">
              {/* Large 2x2 hero image */}
              <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-xl aspect-square bg-surface-container-low">
                <img
                  src={heroImages.hero}
                  alt="Cute Cat Perler Bead Pattern"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://placehold.co/800x800/d9e3f6/ad2c4e?text=Cute+Cat";
                  }}
                />
              </div>

              {/* Top-right small */}
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-square bg-surface-container-low">
                <img
                  src={heroImages.panda}
                  alt="Detailed Panda Perler Bead Pattern"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://placehold.co/400x400/d9e3f6/ad2c4e?text=Panda";
                  }}
                />
              </div>

              {/* Middle-right small */}
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-square bg-surface-container-low">
                <img
                  src={heroImages.food}
                  alt="Cupcake Cherry Perler Bead Pattern"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://placehold.co/400x400/d9e3f6/ad2c4e?text=Cupcake";
                  }}
                />
              </div>

              {/* Bottom full-width collage */}
              <div className="col-span-3 rounded-2xl overflow-hidden shadow-xl aspect-video bg-surface-container-low">
                <img
                  src={heroImages.collage}
                  alt="Cute Fox Perler Bead Pattern"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://placehold.co/1200x675/d9e3f6/ad2c4e?text=Fox";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
