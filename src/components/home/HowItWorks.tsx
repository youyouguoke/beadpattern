"use client";

const steps = [
  {
    icon: "search",
    title: "Search",
    description: "Type any idea — animals, holidays, characters, food. Browse thousands of ready-made patterns instantly.",
  },
  {
    icon: "grid_view",
    title: "Browse",
    description: "Filter by difficulty, grid size, and color count. Preview each pattern before downloading.",
  },
  {
    icon: "auto_awesome",
    title: "Generate if needed",
    description: "Can’t find the perfect match? Let AI create a new pattern. Download as PDF or PNG in seconds.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-surface-container-lowest py-16 md:py-24">
      <div className="container-main">
        <div className="text-center mb-14">
          <h2 className="section-title text-primary">How It Works</h2>
          <p className="section-subtitle mt-3 max-w-2xl mx-auto">
            Find, preview, and craft your favorite bead patterns in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-surface-container-low rounded-3xl p-8 text-center transition-transform hover:-translate-y-1 bead-shadow border border-outline-variant/10"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">{step.icon}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-quicksand font-bold text-body-lg text-on-surface">{step.title}</h3>
              </div>
              <p className="text-on-surface-variant font-body-md">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
