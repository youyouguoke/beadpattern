"use client";

import { Pattern } from "@/lib/patternService";

interface PatternAboutProps {
  pattern: Pattern;
}

export default function PatternAbout({ pattern }: PatternAboutProps) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container">
      <h2 className="font-headline-md text-headline-md mb-4">About This Pattern</h2>
      <div className="text-secondary space-y-4 font-body-md">
        <p>
          This <strong>{pattern.title}</strong> Perler bead pattern is perfect for beginners and experienced crafters alike. The design uses a limited palette, making it easy to source beads and quick to assemble.
        </p>
        <p>
          The finished project measures approximately 8x8 inches when using standard 5mm Perler beads. You can also scale down to mini beads for a smaller charm or keychain.
        </p>
        <p>
          Whether you&apos;re decorating a craft room, making a gift for a friend, or building your kawaii portfolio, this template is a great addition to your collection.
        </p>
      </div>
    </div>
  );
}
