import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { searchPatterns } from "@/lib/publicApiService";
import PatternArchive from "@/components/archive/PatternArchive";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";

const TAG_FAQS: Record<string, { q: string; a: string }[]> = {
  default: [
    { q: "What are Perler bead patterns?", a: "Perler bead patterns are pixel-art templates used to arrange fuse beads on a pegboard before ironing them into a finished design." },
    { q: "Are these patterns free to download?", a: "Yes. BeadPatternAI offers free printable PDF and PNG templates for personal use." },
    { q: "What bead brands work with these patterns?", a: "Our grids are compatible with Perler, Hama, Artkal, and other standard 5mm fuse beads." },
  ],
};

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tagName = titleCase(slug);
  const pageUrl = `${SITE_URL}/tag/${slug}`;
  const title = `${tagName} Perler Bead Patterns | Free Templates | BeadPatternAI`;
  const description = `Browse free ${tagName.toLowerCase()} Perler bead patterns, printable grids, color charts, and step-by-step guides on BeadPatternAI.`;

  return {
    title,
    description,
    keywords: [`${tagName.toLowerCase()} perler bead patterns`, `${tagName.toLowerCase()} fuse bead templates`, `${tagName.toLowerCase()} pixel art`],
    openGraph: { title, description, type: "website", url: pageUrl, siteName: "BeadPatternAI" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: pageUrl },
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tagName = titleCase(slug);
  const pageUrl = `${SITE_URL}/tag/${slug}`;
  const searchResult = await searchPatterns({ q: tagName, limit: 12 });
  const patterns = searchResult.patterns;

  if (patterns.length === 0) {
    notFound();
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tags", item: `${SITE_URL}/tags` },
      { "@type": "ListItem", position: 3, name: tagName, item: pageUrl },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tagName} Perler Bead Patterns`,
    itemListElement: patterns.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/pattern/${p.slug}`,
      name: p.title,
    })),
  };

  const faqs = TAG_FAQS[slug] ?? TAG_FAQS.default;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={faqSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="relative bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/20 mb-8">
          <div className="p-6 md:p-10">
            <nav className="text-body-sm text-on-surface-variant mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/patterns" className="hover:text-primary transition-colors">Patterns</Link>
              <span className="mx-2">/</span>
              <span className="text-on-surface">{tagName}</span>
            </nav>
            <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-3">
              {tagName} Perler Bead Patterns
            </h1>
            <p className="text-on-surface-variant font-body-lg max-w-3xl leading-relaxed">
              Discover free {tagName.toLowerCase()} Perler bead patterns with printable grids, color charts, and step-by-step instructions. Perfect for fuse-bead crafters of all skill levels.
            </p>
          </div>
        </div>

        <PatternArchive searchQuery={tagName} />

        <section className="mt-16 pt-10 border-t border-outline-variant/30">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">
            About {tagName} Perler Bead Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-on-surface-variant font-body-md leading-relaxed">
            <p>
              {tagName} Perler bead patterns are a great way to explore this craft theme. Whether you are making gifts, room decor, or keychains, these templates help you build consistent, colorful designs without drawing grids by hand.
            </p>
            <p>
              Each pattern includes a finished preview, a bead-by-bead grid, and a color list. Download the PDF to print at full scale and use it under a transparent pegboard for easy assembly.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-outline-variant/20 rounded-2xl p-4 bg-surface-container-low">
                <summary className="font-quicksand font-bold text-body-md cursor-pointer list-none flex items-center justify-between text-on-surface">
                  {f.q}
                  <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-on-surface-variant">expand_more</span>
                </summary>
                <p className="text-on-surface-variant mt-3 font-body-md">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
