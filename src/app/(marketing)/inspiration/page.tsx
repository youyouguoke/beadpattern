import type { Metadata } from "next";
import Link from "next/link";
import InspirationGallery from "@/components/home/InspirationGallery";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const SITE_URL = "https://beadpatternai.com";
const PAGE_URL = `${SITE_URL}/inspiration`;

export const metadata: Metadata = {
  title: "Inspiration Gallery | Perler Bead Patterns | BeadPatternAI",
  description: "Browse Pinterest-style Perler bead pattern inspiration. Discover community-made designs, trending ideas, and printable templates.",
  keywords: ["perler bead inspiration", "fuse bead ideas", "pixel art inspiration", "bead pattern gallery", "Pinterest bead patterns"],
  openGraph: {
    title: "Inspiration Gallery | Perler Bead Patterns | BeadPatternAI",
    description: "Browse Pinterest-style Perler bead pattern inspiration. Discover community-made designs, trending ideas, and printable templates.",
    url: PAGE_URL,
    siteName: "BeadPatternAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inspiration Gallery | Perler Bead Patterns | BeadPatternAI",
    description: "Browse Pinterest-style Perler bead pattern inspiration. Discover community-made designs, trending ideas, and printable templates.",
  },
  alternates: { canonical: PAGE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Inspiration", item: PAGE_URL },
  ],
};

export default function InspirationPage() {
  return (
    <main className="min-h-screen bg-surface">
      <JsonLd data={breadcrumbSchema} />
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <nav className="text-body-sm text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">Inspiration</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-quicksand font-bold text-display-lg-mobile md:text-display-lg text-on-surface mb-3">
            Inspiration Gallery
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Pinterest-style Perler bead pattern inspiration. Save your favorite ideas, discover trending designs, and download printable templates.
          </p>
        </div>
      </div>
      <InspirationGallery />
    </main>
  );
}
