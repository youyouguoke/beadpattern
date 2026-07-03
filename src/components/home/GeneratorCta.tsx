"use client";

import Link from "next/link";
import { useState } from "react";

export default function GeneratorCta() {
  const [prompt, setPrompt] = useState("");

  return (
    <section className="px-4 md:px-12 py-20 bg-surface-container-low">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-secondary-container text-secondary text-sm">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          Can&apos;t find your pattern?
        </div>
        <h2 className="font-display-lg text-[1.75rem] md:text-[2.25rem] text-primary-container">
          Create one with AI
        </h2>
        <p className="text-secondary text-base md:text-lg max-w-xl mx-auto">
          We first search thousands of existing patterns. If nothing matches, our AI generates a brand new printable template for you.
        </p>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 bead-shadow border-2 border-secondary-container flex flex-col md:flex-row gap-2 items-center">
          <div className="flex-1 flex items-center px-3 md:px-4 w-full h-12">
            <span className="material-symbols-outlined text-primary mr-2">auto_awesome</span>
            <input
              className="w-full border-none focus:ring-0 text-base placeholder:text-outline bg-transparent outline-none"
              placeholder="e.g., cute frog drinking bubble tea"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <Link
            href={`/generate?q=${encodeURIComponent(prompt || "cute frog drinking bubble tea")}`}
            className="w-full md:w-auto shrink-0 bg-primary-container text-white px-8 py-3 rounded-xl font-headline-md text-sm flex items-center justify-center gap-2 hover:bg-primary transition-colors"
          >
            Generate
          </Link>
        </div>

        <p className="text-sm text-secondary">
          Free 3 AI generations daily
        </p>
      </div>
    </section>
  );
}
