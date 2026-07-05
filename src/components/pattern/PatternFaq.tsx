"use client";

interface PatternFaqProps {
  title?: string;
}

export default function PatternFaq({ title = "Frequently Asked Questions" }: PatternFaqProps) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
      <h2 className="font-headline-md text-headline-md mb-4">{title}</h2>
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
  );
}
