"use client";

import Image from "next/image";
import { PatternStep } from "@/types";
import BeadRenderer from "@/components/BeadRenderer";

export default function PatternSteps({ steps }: { steps: PatternStep[] }) {
  if (!steps.length) return null;
  return (
    <section className="py-8 border-t border-outline-variant/20" aria-label="Steps">
      <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-6">Step-by-Step Guide</h2>
      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.id || step.stepNumber} className="flex gap-4 md:gap-6 items-start">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm md:text-base">
              {step.stepNumber}
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              {step.description && <p className="text-on-surface whitespace-pre-line">{step.description}</p>}
              {step.image && (
                <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-outline-variant/20">
                  <Image src={step.image} alt={`Step ${step.stepNumber}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                </div>
              )}
              {step.gridData && step.gridData.length > 0 && (
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 inline-block">
                  <BeadRenderer grid={step.gridData} palette={[]} width={160} height={160} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
