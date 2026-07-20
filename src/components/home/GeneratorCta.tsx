"use client";

import Link from "next/link";
import { useState } from "react";

export default function GeneratorCta() {
  const [prompt, setPrompt] = useState("");

  return (
    <section className="bg-surface-container-low py-16 md:py-24">
      <div className="container-main">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            Can&apos;t find your pattern?
          </div>
          <h2 className="font-quicksand text-headline-lg text-primary">
            Create one with AI
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            We first search thousands of existing patterns. If nothing matches, our AI generates a brand new printable template for you.
          </p>

          <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant flex flex-col md:flex-row gap-2 items-center">
            <div className="flex-1 flex items-center px-3 md:px-4 w-full h-12">
              <span className="material-symbols-outlined text-primary mr-2">auto_awesome</span>
              <input
                className="w-full border-none focus:ring-0 text-body-md placeholder:text-on-surface-variant bg-transparent outline-none"
                placeholder="e.g., cute frog drinking bubble tea"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Link
              href={`/generate?q=${encodeURIComponent(prompt || "cute frog drinking bubble tea")}`}
              className="w-full md:w-auto shrink-0 bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              Generate
            </Link>
          </div>

          <p className="text-body-sm text-on-surface-variant">
            Free 3 AI generations daily
          </p>
        </div>
      </div>
    </section>
  );
}
