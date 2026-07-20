"use client";

import Link from "next/link";
import type { Pattern } from "@/types";

interface ShareCardProps {
  pattern: Pattern;
}

export default function ShareCard({ pattern }: ShareCardProps) {
  const url = `https://beadpatternai.com/pattern/${pattern.slug}`;

  const sharePinterest = () => {
    const image = pattern.coverImage || pattern.finishedImage || "";
    const desc = encodeURIComponent(`${pattern.title} - free printable Perler bead pattern`);
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${desc}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Check out this ${pattern.title} Perler bead pattern on BeadPatternAI`);
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20">
      <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">Share This Pattern</h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={sharePinterest}
          className="px-5 py-2.5 rounded-full bg-error text-on-error font-label-sm flex items-center gap-2 hover:bg-error-container hover:text-on-error-container transition-colors"
        >
          <span className="material-symbols-outlined">push_pin</span>
          Pinterest
        </button>
        <button
          onClick={shareTwitter}
          className="px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface font-label-sm flex items-center gap-2 hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">chat</span>
          X / Twitter
        </button>
        <button
          onClick={copyLink}
          className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">link</span>
          Copy Link
        </button>
        <Link
          href={`/generate?q=${encodeURIComponent(pattern.title)}`}
          className="px-5 py-2.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm flex items-center gap-2 hover:bg-primary-fixed-dim transition-colors"
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          Generate Similar
        </Link>
      </div>
    </div>
  );
}
