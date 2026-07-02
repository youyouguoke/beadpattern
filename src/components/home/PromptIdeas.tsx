"use client";

import { useState } from "react";
import Link from "next/link";

const promptIdeas = [
  { text: "Cute Frog Drinking Bubble Tea", emoji: "🐸" },
  { text: "Kawaii Cat Reading Book", emoji: "🐱" },
  { text: "Ghost Wearing Witch Hat", emoji: "👻" },
  { text: "Christmas Penguin", emoji: "🐧" },
  { text: "Sleeping Panda", emoji: "🐼" },
  { text: "Tiny Duck", emoji: "🦆" },
  { text: "Pixel Dinosaur", emoji: "🦖" },
  { text: "Halloween Pumpkin", emoji: "🎃" },
];

export default function PromptIdeas() {
  return (
    <section className="px-4 md:px-12 py-12 bg-surface" id="prompt-ideas">
      <div className="mb-10">
        <h2 className="font-headline-md text-headline-md text-primary">✨ AI Prompt Ideas</h2>
        <p className="text-secondary text-sm mt-1">Not sure what to make? Try one of these popular prompts.</p>
      </div>
      <div className="grid grid-cols-8 gap-4">
        {promptIdeas.map((idea) => (
          <div
            key={idea.text}
            className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group"
          >
            <div className="aspect-square overflow-hidden bg-secondary-container relative flex items-center justify-center">
              <span className="text-6xl">{idea.emoji}</span>
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                <Link
                  href="/generate"
                  className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">auto_awesome</span> Generate
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-headline-md text-body-md line-clamp-2">{idea.text}</h3>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">chat_bubble</span> Prompt
                </span>
                <Link href="/generate" className="group-hover:text-primary transition-colors">View →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
