"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PatternDetail as PatternDetailType } from "@/types";
import { getPatternBySlug } from "@/lib/publicApiService";
import PatternPageClient from "./PatternPageClient";
import PatternSkeleton from "./PatternSkeleton";

interface PatternDetailProps {
  slug: string;
  initialPattern?: PatternDetailType | null;
  initialFinishedImage?: { type: "image" | "svg"; src: string; svg?: string } | null;
}

export default function PatternDetail({ slug, initialPattern, initialFinishedImage }: PatternDetailProps) {
  const [pattern, setPattern] = useState<PatternDetailType | null>(initialPattern || null);
  const [loading, setLoading] = useState(!initialPattern);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialPattern) {
      setLoading(true);
      getPatternBySlug(slug)
        .then((p) => {
          setPattern(p);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [slug, initialPattern]);

  if (loading) return <PatternSkeleton />;
  if (!pattern) return <div className="pt-28 text-center text-on-surface-variant">Pattern not found.</div>;

  return (
    <PatternPageClient
      slug={slug}
      pattern={pattern}
      related={[]}
      relatedImages={{}}
      finishedImage={initialFinishedImage || { type: "image", src: pattern.finishedImage || pattern.coverImage || "" }}
    />
  );
}
