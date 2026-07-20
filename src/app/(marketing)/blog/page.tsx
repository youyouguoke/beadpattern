import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import ClientImage from "@/components/ClientImage";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/blog`;

export const metadata: Metadata = {
  title: "BeadPatternAI Blog | Perler Bead Ideas & Tutorials",
  description: "Explore Perler bead tutorials, pattern ideas, craft tips, and seasonal inspiration. Learn how to design, iron, and finish your next fuse bead project.",
  keywords: ["perler bead blog", "fuse bead tutorials", "perler bead tips", "pixel art tutorials", "bead pattern ideas"],
  openGraph: {
    title: "BeadPatternAI Blog | Perler Bead Ideas & Tutorials",
    description: "Perler bead tutorials, pattern ideas, and seasonal inspiration for fuse bead crafters.",
    type: "website",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeadPatternAI Blog | Perler Bead Ideas & Tutorials",
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
    image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-cat.png",
    aspect: "4/5" as const,
  },
  {
    slug: "how-to-choose-grid-size",
    title: "How to Choose the Right Grid Size",
    excerpt: "16x16, 32x32, or 64x64? Pick the perfect canvas for your skill level and project.",
    category: "Tips",
    date: "2026-07-12",
    image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/detailed-panda.png",
    aspect: "4/5" as const,
  },
  {
    slug: "top-10-kawaii-patterns",
    title: "Top 10 Kawaii Perler Bead Patterns",
    excerpt: "Cute characters and sweet designs perfect for beginners and gifts.",
    category: "Inspiration",
    date: "2026-07-15",
    image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cupcake-cherry.png",
    aspect: "4/5" as const,
  },
  {
    slug: "halloween-perler-bead-ideas",
    title: "Spooky Halloween Perler Bead Ideas",
    excerpt: "Ghosts, pumpkins, bats, and more seasonal patterns for your Halloween crafts.",
    category: "Seasonal",
    date: "2026-07-18",
    image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/covers/cute-fox.png",
    aspect: "4/5" as const,
  },
];

const featured = {
  slug: "mastering-the-flat-melt",
  title: "Mastering the Flat Melt: A Pro's Guide to Perfect Finishes",
  excerpt: "Achieving that smooth, professional look in your bead projects requires precision and patience. Learn the ironing secrets the experts use to transform simple beads into durable art.",
  category: "Editorial",
  image: "https://pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev/finished/cute-cat.png",
};

const categories = [
  { id: "tutorials", label: "Tutorials", icon: "school" },
  { id: "ideas", label: "Ideas", icon: "lightbulb" },
  { id: "collections", label: "Collections", icon: "grid_view" },
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

      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-8 pt-28">
        {/* Hero Header */}
        <h1 className="font-quicksand text-display-lg-mobile md:text-display-lg text-center md:text-left text-primary mb-10">
          Perler Bead Ideas & Tutorials
        </h1>

        {/* Featured Article */}
        <section className="mb-16 group">
          <Link href={`/blog/${featured.slug}`} className="block overflow-hidden rounded-xl bg-surface-container-low shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-3/5 overflow-hidden">
                <div className="h-[400px] md:h-[600px] overflow-hidden">
                  <ClientImage
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              <div className="w-full md:w-2/5 p-8 md:p-14 flex flex-col justify-center bg-surface">
                <span className="inline-block px-3 py-1 bg-[#FFF0F3] text-primary font-label-md rounded-full mb-6 w-fit">
                  {featured.category}
                </span>
                <h2 className="font-quicksand text-headline-lg-mobile md:text-headline-lg mb-6 leading-tight text-on-surface">
                  {featured.title}
                </h2>
                <p className="text-on-surface-variant font-plus-jakarta text-body-lg mb-8 leading-relaxed">
                  {featured.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4">
                  Read the Full Guide
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Category Discovery */}
        <section className="mb-16">
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/blog?category=${cat.id}`} className="flex flex-col items-center group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-3 group-hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined text-primary text-4xl">{cat.icon}</span>
                </div>
                <span className="font-label-md uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest from the Studio */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b border-outline-variant/30 pb-4">
            <h3 className="font-quicksand font-bold text-headline-md text-on-surface">
              Latest from the Studio
            </h3>
            <Link href="/blog" className="text-primary font-label-md hover:underline">
              View All Articles
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="flex flex-col group cursor-pointer">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-[4/5] mb-6 overflow-hidden rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <ClientImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#FFF0F3] text-primary font-label-md rounded-full shadow-sm">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-quicksand font-bold text-headline-md mb-2 group-hover:text-primary transition-colors text-on-surface">
                    {post.title}
                  </h4>
                  <p className="text-on-surface-variant font-plus-jakarta text-body-md line-clamp-2">
                    {post.excerpt}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-[#FCFAF9] rounded-xl p-10 md:p-20 text-center mb-16 border border-outline-variant/20">
          <div className="max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-primary text-4xl mb-6">mail</span>
            <h3 className="font-quicksand text-headline-lg-mobile md:text-headline-lg mb-4 text-on-surface">
              Never Miss a Pattern
            </h3>
            <p className="text-on-surface-variant font-plus-jakarta text-body-lg mb-8">
              Join 15,000+ makers and get our weekly newsletter featuring exclusive new templates and studio tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                className="flex-grow bg-surface border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                placeholder="Your email address"
                type="email"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary px-8 py-3 font-label-md rounded-lg hover:opacity-95 transition-all"
              >
                Sign Up
              </button>
            </form>
            <p className="text-body-sm text-on-surface-variant mt-4">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
