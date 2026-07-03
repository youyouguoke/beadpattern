"use client";

import Link from "next/link";

export default function SeoSection() {
  return (
    <section className="px-4 md:px-12 py-20 bg-white border-y border-surface-container-high">
      <div className="max-w-4xl mx-auto space-y-14">
        <div className="text-center">
          <h2 className="font-display-lg text-display-lg-mobile text-primary-container mb-4">
            The Ultimate Guide to Perler Bead Patterns and Design
          </h2>
          <p className="text-secondary font-body-lg">
            Whether you are new to fuse beads or a seasoned pixel artist, BeadPatternAI helps you craft faster, easier, and with more joy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/category/animals" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Animals</Link>
          <Link href="/category/food" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Food</Link>
          <Link href="/category/halloween" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Halloween</Link>
          <Link href="/category/christmas" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Christmas</Link>
          <Link href="/category/kawaii" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Kawaii</Link>
          <Link href="/category/gaming" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Gaming</Link>
          <Link href="/collection/beginner" className="text-primary underline underline-offset-4 hover:text-primary-container font-medium">Beginner Patterns</Link>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">What Are Perler Beads?</h3>
          <p className="text-secondary font-body-md">
            Perler beads — also known as fuse beads, Hama beads, or Artkal beads — are small plastic beads that you arrange on a pegboard to form pixel-art style designs. Once your pattern is complete, you cover it with ironing paper and melt the beads with a household iron. The result is a durable, colorful plastic piece you can use as magnets, keychains, coasters, or wall art.
          </p>
          <p className="text-secondary font-body-md">
            The craft became popular because it is easy to learn, inexpensive to start, and incredibly satisfying. All you need is a pegboard, a few bead colors, ironing paper, and a pattern. With BeadPatternAI, you no longer need to draw grids by hand or search for hours online — our AI turns your ideas into printable templates in seconds.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">How to Choose the Right Pattern</h3>
          <p className="text-secondary font-body-md">
            When selecting a pattern, consider the grid density. A smaller grid like 16x16 or 24x24 is perfect for keychains, magnets, or beginner projects. Larger grids like 48x48 or 64x64 allow for incredible detail but require more beads and multiple interlocking pegboards. Our AI generator lets you specify the complexity level, ensuring you never feel overwhelmed by a project that is too large for your current setup.
          </p>
          <p className="text-secondary font-body-md">
            Color count is another critical factor. Professional bead artists often use hundreds of shades, but most beginners start with a standard bucket of 22,000 beads. Our search filters help you find patterns based on the number of colors you own, making sure your physical beads match the digital template perfectly.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">The Power of AI in Bead Art</h3>
          <p className="text-secondary font-body-md">
            Traditionally, creating a custom pattern required meticulous manual work in a pixel editor. Now, with BeadPatternAI, you can simply describe your vision. Want a "cyberpunk neon cat" or a "cozy cottagecore mushroom"? Our AI interprets the aesthetic and translates it into a palette of real bead colors, placing each pixel where it makes the most sense visually and structurally.
          </p>
          <p className="text-secondary font-body-md">
            This technology does not just create images — it creates instructions. Our printable PDFs include a detailed color key with bead codes, an estimated bead count for each color, and a full-size template that can be placed directly under a clear pegboard for easy tracing.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">Printable Pattern Guide</h3>
          <ul className="list-disc list-inside text-secondary font-body-md space-y-2">
            <li><strong>Choose your grid size:</strong> Small projects start at 16x16; detailed portraits may need 48x48 or larger.</li>
            <li><strong>Pick a palette:</strong> Fewer colors make the project faster and cheaper.</li>
            <li><strong>Print at 100% scale:</strong> This ensures each bead circle matches a real 5mm bead.</li>
            <li><strong>Slide under a transparent pegboard:</strong> This removes the need to count rows.</li>
            <li><strong>Iron evenly:</strong> Use medium heat with ironing paper, moving in circles for 10-15 seconds.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">Tips for Perfect Fusing</h3>
          <p className="text-secondary font-body-md">
            Once your beads are placed, the ironing process is where the magic happens. Use high-quality parchment paper — never wax paper — and apply gentle, circular pressure with a medium-heat iron. The flat melt versus the open-hole look is a matter of personal preference, but consistency is key across the entire design. Our patterns include tips specific to the design's density to help you achieve the perfect fuse every time.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline-md text-headline-md">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                Is BeadPatternAI free to use?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">Yes. You can generate and download patterns for free. We offer premium features for power users who need batch exports and custom color charts.</p>
            </details>
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                Can I sell crafts made from these patterns?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">You can sell physical crafts made from your own original prompts. Patterns based on copyrighted characters should be for personal use only.</p>
            </details>
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                What bead brands are supported?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">We support Perler, Hama, Artkal, and generic cross-stitch grids. You can switch formats in the generator settings.</p>
            </details>
            <details className="group border border-surface-container-high rounded-xl p-4">
              <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
                How do I find patterns for my skill level?
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <p className="text-secondary mt-3 font-body-md">Use the Difficulty filter on category and search pages. Beginner patterns use fewer colors and smaller grids; advanced patterns offer more detail and larger canvases.</p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
