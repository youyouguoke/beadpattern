import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Bead Pattern Generator | BeadPatternAI",
  description: "Generate Perler bead patterns with AI. Customize grid size, palette, and style to create printable bead templates.",
};

export default function GeneratePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 md:px-12 py-20 bg-surface">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary-container text-white flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl">auto_awesome</span>
        </div>
        <h1 className="font-display-lg text-3xl md:text-4xl text-primary-container">
          AI Pattern Generator
        </h1>
        <p className="text-secondary text-lg">
          We&apos;re building something amazing here. The AI pattern generator is not ready yet — please check back soon.
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-label-lg hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            Browse Patterns
          </a>
        </div>
      </div>
    </main>
  );
}
