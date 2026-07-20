import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/blog`;

export const metadata: Metadata = {
  title: "BeadPatternAI Blog | Perler Bead Tutorials, Patterns & Craft Tips",
  description: "Explore Perler bead tutorials, pattern ideas, craft tips, and seasonal inspiration. Learn how to design, iron, and finish your next fuse bead project.",
  keywords: ["perler bead blog", "fuse bead tutorials", "perler bead tips", "pixel art tutorials", "bead pattern ideas"],
  openGraph: {
    title: "BeadPatternAI Blog | Perler Bead Tutorials & Craft Tips",
    description: "Perler bead tutorials, pattern ideas, and seasonal inspiration for fuse bead crafters.",
    type: "website",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeadPatternAI Blog | Perler Bead Tutorials & Craft Tips",
    description: "Perler bead tutorials, pattern ideas, and seasonal inspiration for fuse bead crafters.",
  },
  alternates: { canonical: PAGE_URL },
};

const posts = [
  {
    slug: "beginner-guide-to-perler-beads",
    title: "The Beginner's Guide to Perler Beads",
    excerpt: "Everything you need to know to start: beads, boards, ironing tips, and your first pattern.",
    category: "Tutorials",
    date: "2026-07-10",
  },
  {
    slug: "how-to-choose-grid-size",
    title: "How to Choose the Right Grid Size",
    excerpt: "16x16, 32x32, or 64x64? Pick the perfect canvas for your skill level and project.",
    category: "Tips",
    date: "2026-07-12",
  },
  {
    slug: "top-10-kawaii-patterns",
    title: "Top 10 Kawaii Perler Bead Patterns",
    excerpt: "Cute characters and sweet designs perfect for beginners and gifts.",
    category: "Inspiration",
    date: "2026-07-15",
  },
  {
    slug: "halloween-perler-bead-ideas",
    title: "Spooky Halloween Perler Bead Ideas",
    excerpt: "Ghosts, pumpkins, bats, and more seasonal patterns for your Halloween crafts.",
    category: "Seasonal",
    date: "2026-07-18",
  },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: PAGE_URL },
  ],
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "BeadPatternAI Blog",
  url: PAGE_URL,
  blogPost: posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    url: `${SITE_URL}/blog/${p.slug}`,
    datePublished: p.date,
  })),
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={blogSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <div className="mb-10">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-3">
            BeadPatternAI Blog
          </h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl">
            Tutorials, pattern ideas, and craft tips for Perler bead lovers of every skill level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 hover:-translate-y-1 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-sm font-bold">
                  {post.category}
                </span>
                <span className="text-label-sm text-on-surface-variant">{post.date}</span>
              </div>
              <h2 className="font-quicksand font-bold text-headline-md text-on-surface mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-on-surface-variant font-body-md">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
