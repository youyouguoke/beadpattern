"use client";

import type { PatternFAQ } from "@/types";

interface PatternFaqProps {
  faqs?: PatternFAQ[];
  title?: string;
}

export default function PatternFaq({ faqs = [], title = "Frequently Asked Questions" }: PatternFaqProps) {
  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
        <h2 className="font-headline-md text-headline-md mb-4">{title}</h2>
        <p className="text-secondary font-body-md">No FAQs for this pattern yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
      <h2 className="font-headline-md text-headline-md mb-4">{title}</h2>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.id} className="group border border-surface-container-high rounded-xl p-4">
            <summary className="font-headline-md text-body-md cursor-pointer list-none flex items-center justify-between">
              {faq.question}
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <p className="text-secondary mt-3 font-body-md">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
