"use client";

const benefits = [
  { title: "Beginner Friendly", desc: "No design skills needed. Just describe what you want and let the AI do the heavy lifting of grid mapping." },
  { title: "Printable Templates", desc: "Our patterns are generated at exact physical scale. Print them out and place them directly under your pegboard." },
  { title: "Pinterest-Ready Designs", desc: "Get the aesthetic you've always wanted. Our AI is trained on thousands of viral perler bead trends." },
  { title: "Free Downloads", desc: "Start creating immediately with our free tier. Download high-resolution patterns instantly." },
];

export default function WhySection() {
  return (
    <section className="px-4 md:px-12 py-16 bg-white border-y border-surface-container-high">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-headline-md text-display-lg-mobile text-primary-container mb-10">Why Use AI Perler Bead Patterns?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-4">
              <span className="material-symbols-outlined text-tertiary shrink-0">check_circle</span>
              <div>
                <h4 className="font-headline-md text-body-md">{b.title}</h4>
                <p className="text-secondary font-body-md">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
