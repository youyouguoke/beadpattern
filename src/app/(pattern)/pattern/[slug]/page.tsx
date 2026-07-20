import type { Metadata } from "next";
import { Suspense } from "react";
import PatternPageClient from "@/components/pattern/PatternPageClient";
import { getPatternBySlug, getRecommendedPatterns } from "@/lib/publicApiService";
import { getPatternImage } from "@/lib/patternImage";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL = "https://beadpatternai.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern) return { title: "Pattern Not Found | BeadPatternAI" };

  const title = pattern.seoTitle || `${pattern.title} | Free Perler Bead Pattern | BeadPatternAI`;
  const description = pattern.seoDescription || `Download ${pattern.title} Perler bead pattern. ${pattern.gridSize} grid, ${pattern.estimatedBeads} beads, ${pattern.difficulty} difficulty. Free printable PDF and color guide.`;
  const url = `${SITE_URL}/pattern/${pattern.slug}`;
  const image = pattern.coverImage || pattern.finishedImage;

  return {
    title,
    description,
    keywords: pattern.seoKeywords || `${pattern.title}, perler bead pattern, fuse bead template, beadpatternai`,
    openGraph: {
      title,
      description,
      url,
      siteName: "BeadPatternAI",
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function PatternDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);
  if (!pattern) notFound();

  const rec = await getRecommendedPatterns(slug);
  const related = [
    ...(pattern.related || []),
    ...rec.related,
    ...rec.sameCollection,
    ...rec.sameCategory,
    ...rec.sameTag,
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .filter((p) => p.slug !== slug)
    .slice(0, 8);

  const relatedImages: Record<string, { type: "image" | "svg"; src: string; svg?: string }> = {};
  for (const p of related) {
    relatedImages[p.slug] = getPatternImage(p, { width: 240, height: 240, preferGrid: true });
  }

  const finishedImage = getPatternImage(pattern, { width: 560, height: 560 });
  const pageUrl = `${SITE_URL}/pattern/${pattern.slug}`;
  const category = pattern.categories?.[0];

  const creativeWork = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: pattern.title,
    description: pattern.description,
    image: pattern.coverImage || pattern.finishedImage,
    url: pageUrl,
    learningResourceType: "Perler bead pattern",
    educationalLevel: pattern.difficulty,
    datePublished: pattern.publishedAt,
    dateModified: pattern.updatedAt,
    author: { "@type": "Organization", name: "BeadPatternAI" },
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pattern.title,
    description: pattern.description,
    image: pattern.coverImage || pattern.finishedImage,
    url: pageUrl,
    brand: { "@type": "Brand", name: "BeadPatternAI" },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "USD",
      price: "0",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Patterns", item: `${SITE_URL}/patterns` },
      ...(category
        ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/category/${category.slug}` }]
        : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: pattern.title, item: pageUrl },
    ],
  };

  const itemList = related.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: related.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/pattern/${p.slug}`,
      name: p.title,
    })),
  } : null;

  const faqPage = pattern.faqs?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pattern.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <main className="min-h-screen bg-surface">
      <div className="container-main py-8 pt-28">
        <JsonLd data={creativeWork} />
        <JsonLd data={productSchema} />
        <JsonLd data={breadcrumbList} />
        {itemList && <JsonLd data={itemList} />}
        {faqPage && <JsonLd data={faqPage} />}
        <Suspense fallback={<div className="pt-28 text-center text-on-surface-variant">Loading pattern...</div>}>
          <PatternPageClient
            slug={slug}
            pattern={pattern}
            related={related}
            relatedImages={relatedImages}
            finishedImage={finishedImage}
          />
        </Suspense>
      </div>
    </main>
  );
}
