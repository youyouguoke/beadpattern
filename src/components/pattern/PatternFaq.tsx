"use client";

import type { PatternFAQ } from "@/types";

interface PatternFaqProps {
  faqs?: PatternFAQ[];
  title?: string;
}

export default function PatternFaq({ faqs = [], title = "Frequently Asked Questions" }: PatternFaqProps) {
  if (faqs.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20">
        <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">{title}</h2>
        <p className="text-on-surface-variant font-body-md">No FAQs for this pattern yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20">
      <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">{title}</h2>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.id} className="group border border-outline-variant/20 rounded-2xl p-4 bg-surface-container-low">
            <summary className="font-quicksand font-bold text-body-md cursor-pointer list-none flex items-center justify-between text-on-surface">
              {faq.question}
              <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-on-surface-variant">expand_more</span>
            </summary>
            <p className="text-on-surface-variant mt-3 font-body-md">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
