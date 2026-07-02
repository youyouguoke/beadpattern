"use client";

export default function SeoSection() {
  return (
    <section className="px-4 md:px-12 py-16 bg-white border-y border-surface-container-high">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="font-headline-md text-display-lg-mobile text-primary-container mb-4">
            Everything You Need to Know About Perler Bead Patterns
          </h2>
          <p className="text-secondary font-body-lg">
            Whether you are new to fuse beads or a seasoned pixel artist, our AI-powered generator and curated library help you craft faster, easier, and with more joy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
            <h3 className="font-headline-md text-headline-md">How AI Generates Bead Patterns</h3>
            <p className="text-secondary font-body-md">
              Our AI understands your prompt, chooses a color palette that works for real beads, and maps every pixel to a physical bead position. You can select grid sizes from 16x16 to 64x64, choose bead formats like Perler, Artkal, or Hama, and control the number of colors to keep your project manageable.
            </p>
            <p className="text-secondary font-body-md">
              The generator produces a high-resolution PDF with a 1:1 bead grid. You can place the printed page under a transparent pegboard and follow the colors bead by bead. This is especially useful for educators, hobbyists, and anyone who wants to turn fan art, pets, or seasonal themes into tangible crafts.
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
