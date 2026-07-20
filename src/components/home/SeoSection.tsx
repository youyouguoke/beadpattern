"use client";

import Link from "next/link";

export default function SeoSection() {
  return (
    <section className="bg-surface py-16 md:py-24 border-y border-outline-variant/30">
      <div className="container-main max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="section-title text-primary">
            The Ultimate Guide to Perler Bead Patterns and Design
          </h2>
          <p className="section-subtitle mt-3">
            Whether you are new to fuse beads or a seasoned pixel artist, BeadPatternAI helps you craft faster, easier, and with more joy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-14">
          {["Animals", "Food", "Halloween", "Christmas", "Kawaii", "Gaming", "Beginner Patterns"].map((label) => (
            <Link
              key={label}
              href={`/patterns?q=${encodeURIComponent(label)}`}
              className="text-primary underline underline-offset-4 hover:text-primary-container font-body-md"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="space-y-12">
          <article className="space-y-4">
            <h3 className="font-quicksand font-bold text-headline-md text-on-surface">What Are Perler Beads?</h3>
            <p className="text-on-surface-variant font-body-md">
              Perler beads — also known as fuse beads, Hama beads, or Artkal beads — are small plastic beads that you arrange on a pegboard to form pixel-art style designs. Once your pattern is complete, you cover it with ironing paper and melt the beads with a household iron. The result is a durable, colorful plastic piece you can use as magnets, keychains, coasters, or wall art.
            </p>
            <p className="text-on-surface-variant font-body-md">
              The craft became popular because it is easy to learn, inexpensive to start, and incredibly satisfying. All you need is a pegboard, a few bead colors, ironing paper, and a pattern. With BeadPatternAI, you no longer need to draw grids by hand or search for hours online — our library gives you thousands of ready-to-print templates.
            </p>
          </article>

          <article className="space-y-4">
            <h3 className="font-quicksand font-bold text-headline-md text-on-surface">How to Choose the Right Pattern</h3>
            <p className="text-on-surface-variant font-body-md">
              When selecting a pattern, consider the grid density. A smaller grid like 16x16 or 24x24 is perfect for keychains, magnets, or beginner projects. Larger grids like 48x48 or 64x64 allow for incredible detail but require more beads and multiple interlocking pegboards. Our filters help you find the right complexity level.
            </p>
            <p className="text-on-surface-variant font-body-md">
              Color count is another critical factor. Professional bead artists often use hundreds of shades, but most beginners start with a standard bucket of 22,000 beads. Our search filters help you find patterns based on the number of colors you own, making sure your physical beads match the digital template perfectly.
            </p>
          </article>

          <article className="space-y-4">
            <h3 className="font-quicksand font-bold text-headline-md text-on-surface">Printable Pattern Guide</h3>
            <ul className="list-disc list-inside text-on-surface-variant font-body-md space-y-2">
              <li><strong>Choose your grid size:</strong> Small projects start at 16x16; detailed portraits may need 48x48 or larger.</li>
              <li><strong>Pick a palette:</strong> Fewer colors make the project faster and cheaper.</li>
              <li><strong>Print at 100% scale:</strong> This ensures each bead circle matches a real 5mm bead.</li>
              <li><strong>Slide under a transparent pegboard:</strong> This removes the need to count rows.</li>
              <li><strong>Iron evenly:</strong> Use medium heat with ironing paper, moving in circles for 10-15 seconds.</li>
            </ul>
          </article>

          <article className="space-y-4">
            <h3 className="font-quicksand font-bold text-headline-md text-on-surface">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {[
                {
                  q: "Is BeadPatternAI free to use?",
                  a: "Yes. You can browse and download patterns for free. We offer premium features for power users who need batch exports and custom color charts."
                },
                {
                  q: "Can I sell crafts made from these patterns?",
                  a: "You can sell physical crafts made from original patterns. Patterns based on copyrighted characters should be for personal use only."
                },
                {
                  q: "What bead brands are supported?",
                  a: "We support Perler, Hama, Artkal, and generic cross-stitch grids. You can switch formats in the generator settings."
                },
                {
                  q: "How do I find patterns for my skill level?",
                  a: "Use the Difficulty filter on category and search pages. Beginner patterns use fewer colors and smaller grids; advanced patterns offer more detail and larger canvases."
                }
              ].map(({ q, a }) => (
                <details key={q} className="group border border-outline-variant rounded-xl p-4 bg-surface-container-lowest">
                  <summary className="font-quicksand font-bold text-body-md cursor-pointer list-none flex items-center justify-between text-on-surface">
                    {q}
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <p className="text-on-surface-variant mt-3 font-body-md">{a}</p>
                </details>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
