import type { Tag } from '../types';

export interface SEOPayload {
  title: string;
  description: string | null;
  tags: Tag[];
}

export function generateSEO(pattern: SEOPayload) {
  const title = `${pattern.title} | BeadPatternAI`;
  const description = pattern.description ?? `Discover this beautiful ${pattern.title} Perler bead pattern. Free printable template with color palette and step-by-step guide.`;
  const keywords = pattern.tags.map((t) => t.name).join(', ');

  return {
    title,
    description,
    keywords: keywords || 'perler bead pattern, bead pattern, pixel art, craft',
  };
}

export function generatePatternUrl(origin: string, slug: string): string {
  return `${origin}/pattern/${slug}`;
}

export function generateTagUrl(origin: string, slug: string): string {
  return `${origin}/tag/${slug}`;
}
