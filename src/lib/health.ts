import type { Pattern, PatternSeo, HealthCheck, HealthResult } from '../types';

export interface HealthPatternCollection { collection_id: string }

export function computeHealthScore(
  pattern: Pattern,
  patternSteps: { step_number: number }[],
  patternTags: { tag_id: string }[],
  patternCollections: { collection_id: string }[],
  patternSeo: PatternSeo | { title: string | null; description: string | null } | null,
  patternColors: { count?: number }[]
): HealthResult {
  const checks: HealthCheck[] = [
    { name: 'cover_image', passed: Boolean(pattern.cover_image), weight: 10 },
    { name: 'finished_image', passed: Boolean(pattern.finished_image), weight: 10 },
    { name: 'steps_4_or_more', passed: patternSteps.length >= 4, weight: 15 },
    { name: 'seo_title', passed: Boolean(patternSeo?.title || pattern.seo_title), weight: 10 },
    { name: 'seo_description', passed: Boolean(patternSeo?.description || pattern.seo_description), weight: 10 },
    { name: 'tags_3_or_more', passed: patternTags.length >= 3, weight: 10 },
    { name: 'in_collection', passed: patternCollections.length > 0, weight: 10 },
    { name: 'in_category', passed: true, weight: 10 }, // categories table added; placeholder since not yet wired
    { name: 'colors_3_or_more', passed: patternColors.length >= 3, weight: 10 },
    { name: 'description_80_chars', passed: (pattern.description?.length ?? 0) >= 80, weight: 5 },
    { name: 'faq_present', passed: true, weight: 0 },
  ];

  const score = Math.min(
    100,
    checks.reduce((acc, check) => acc + (check.passed ? check.weight : 0), 0)
  );

  return { score, checks };
}
