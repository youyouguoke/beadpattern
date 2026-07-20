import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";

const posts: Record<string, { title: string; description: string; date: string; category: string; content: string }> = {
  "beginner-guide-to-perler-beads": {
    title: "The Beginner's Guide to Perler Beads",
    description: "Learn the basics of Perler beads: supplies, ironing tips, and how to read your first pattern.",
    date: "2026-07-10",
    category: "Tutorials",
    content: `Perler beads — also called fuse beads or Hama beads — are small plastic beads that you arrange on a pegboard to create pixel-art designs. Once arranged, you cover them with ironing paper and melt the beads together with a household iron. This guide covers everything you need to start your first project.

## What You Need

- A pegboard matching your grid size
- Fuse beads (Perler, Hama, or Artkal)
- Ironing paper or parchment paper
- A household iron on medium heat
- A printed pattern or a bead grid

## How to Read a Pattern

Each square on the grid represents one bead. Match the color in the grid to the bead color in your palette. Start from one corner and work row by row to avoid knocking beads out of place.

## Ironing Tips

Preheat your iron to medium heat. Place ironing paper over the beads and move the iron in slow circles for 10–15 seconds. Let the design cool before removing it from the board. For larger pieces, iron in sections and use a heavy book to keep the piece flat while it cools.

Happy crafting!`,
  },
  "how-to-choose-grid-size": {
    title: "How to Choose the Right Grid Size",
    description: "Picking between 16x16, 32x32, and 64x64 grids for your Perler bead project.",
    date: "2026-07-12",
    category: "Tips",
    content: `Grid size determines both detail and difficulty. A 16x16 grid is great for keychains and magnets. A 32x32 grid is the most common choice for balanced detail and speed. A 48x48 or 64x64 grid is ideal for portraits or complex scenes but requires more beads and multiple pegboards.

Use the Difficulty and Grid Size filters on BeadPatternAI to find projects that match your time and supplies.`,
  },
  "top-10-kawaii-patterns": {
    title: "Top 10 Kawaii Perler Bead Patterns",
    description: "Cute characters and sweet designs for your next Perler bead project.",
    date: "2026-07-15",
    category: "Inspiration",
    content: `Kawaii patterns are some of the most popular designs on BeadPatternAI. From smiling foods to tiny animals, these projects use simple shapes and bright colors. They make great gifts, pins, and backpack charms. Browse our Kawaii category for the latest designs.`,
  },
  "halloween-perler-bead-ideas": {
    title: "Spooky Halloween Perler Bead Ideas",
    description: "Ghosts, pumpkins, bats, and more Halloween Perler bead patterns.",
    date: "2026-07-18",
    category: "Seasonal",
    content: `Halloween is the perfect season for Perler beads. Try ghosts, black cats, pumpkins, bats, and candy corn. These small projects are quick to make and perfect for decorations, magnets, or trick-or-treat gifts.`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post Not Found | BeadPatternAI" };
  const pageUrl = `${SITE_URL}/blog/${slug}`;
  return {
    title: `${post.title} | BeadPatternAI Blog`,
    description: post.description,
    keywords: [post.category.toLowerCase(), "perler bead", "fuse bead", "pixel art"],
    openGraph: { title: post.title, description: post.description, type: "article", url: pageUrl, siteName: "BeadPatternAI" },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
    alternates: { canonical: pageUrl },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    return (
      <main className="min-h-screen bg-surface">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-4">Post Not Found</h1>
          <p className="text-on-surface-variant font-body-lg mb-6">This blog post does not exist yet.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary-container font-label-md">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: pageUrl,
    datePublished: post.date,
    author: { "@type": "Organization", name: "BeadPatternAI" },
    publisher: { "@type": "Organization", name: "BeadPatternAI", logo: `${SITE_URL}/logo.png` },
  };

  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={articleSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{post.title}</span>
        </nav>

        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 border border-outline-variant/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-sm font-bold">
              {post.category}
            </span>
            <span className="text-label-sm text-on-surface-variant">{post.date}</span>
          </div>
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-primary mb-4">
            {post.title}
          </h1>
          <p className="text-on-surface-variant font-body-lg mb-8">{post.description}</p>
          <div className="prose prose-pink max-w-none font-body-md text-on-surface">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                return <h2 key={i} className="font-quicksand font-bold text-headline-md text-on-surface mt-8 mb-3">{paragraph.slice(3)}</h2>;
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={i} className="list-disc list-inside text-on-surface-variant space-y-1 mb-4">
                    {paragraph.split("\n").map((item, j) => (
                      <li key={j}>{item.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i} className="text-on-surface-variant mb-4 leading-relaxed">{paragraph}</p>;
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
