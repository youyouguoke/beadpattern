"use client";

const steps = [
  {
    number: "1",
    title: "Describe Your Idea",
    desc: "Type anything from a space cat to pixel art roses into our AI prompt box.",
    before: "cute frog drinking bubble tea",
    afterColor: "#74c69d",
  },
  {
    number: "2",
    title: "AI Generates Template",
    desc: "Our AI calculates the perfect bead placement and creates a detailed 1:1 grid pattern.",
    before: "AI thinking...",
    afterColor: "#52b788",
  },
  {
    number: "3",
    title: "Download & Print",
    desc: "Get a high-quality PDF template you can place right under your pegboard.",
    before: "PDF ready",
    afterColor: "#48dbfb",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-headline-md text-headline-md text-center mb-4">How to Create Your Pattern</h2>
        <p className="text-secondary text-center mb-16 max-w-2xl mx-auto">
          From idea to printable bead template in three simple steps.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-2xl p-6 bead-shadow text-center space-y-4">
              <div className="w-12 h-12 bg-primary text-white font-display-lg text-body-md rounded-full flex items-center justify-center mx-auto">
                {step.number}
              </div>
              <div className="aspect-video rounded-xl bg-surface-container overflow-hidden flex items-center justify-center relative">
                <div className="absolute inset-0 grid grid-cols-12 gap-px opacity-20">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <div key={i} className="bg-secondary" />
                  ))}
                </div>
                <div className="z-10 text-center space-y-2">
                  <p className="text-label-sm text-secondary">Before</p>
                  <p className="text-body-md text-primary font-headline-md">{step.before}</p>
                  <div className="w-12 h-12 mx-auto rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: step.afterColor }} />
                  <p className="text-label-sm text-secondary">After</p>
                </div>
              </div>
              <h3 className="font-headline-md text-headline-md">{step.title}</h3>
              <p className="text-secondary">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
