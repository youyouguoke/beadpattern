import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const GA_ID = "G-6PQKQYXEB3";

export const metadata: Metadata = {
  title: "BeadPatternAI | AI Perler Bead Pattern Generator",
  description: "Create, discover and download beautiful AI-generated Perler bead patterns. Generate printable PDF templates and pixel art designs instantly.",
  openGraph: {
    title: "BeadPatternAI | AI Perler Bead Pattern Generator",
    description: "Create, discover and download beautiful AI-generated Perler bead patterns. Generate printable PDF templates and pixel art designs instantly.",
    url: "https://beadpatternai.com",
    siteName: "BeadPatternAI",
    images: [
      {
        url: "https://beadpatternai.com/og-beadpatternai.png",
        width: 1200,
        height: 630,
        alt: "A cute rainbow heart made of Perler beads from BeadPatternAI",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeadPatternAI | AI Perler Bead Pattern Generator",
    description: "Create, discover and download beautiful AI-generated Perler bead patterns. Generate printable PDF templates and pixel art designs instantly.",
    images: ["https://beadpatternai.com/og-beadpatternai.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <head>
        <link rel="icon" type="image/png" href="https://beadpatternai.com/icon.png?v=3" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Quicksand:wght@700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />

        {/* Google tag (gtag.js) */}
        <script
          id="ga-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6PQKQYXEB3', { send_page_view: true });
              (function(){
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-6PQKQYXEB3';
                s.id = 'ga-script';
                var first = document.getElementsByTagName('script')[0];
                first.parentNode.insertBefore(s, first);
              })();
            `,
          }}
        />

        {/* Plausible Analytics */}
        <script
          defer
          data-domain="beadpatternai.com"
          data-api="https://plausible.shipsolo.io/api/event"
          src="https://plausible.shipsolo.io/js/script.js"
        />
      </head>
      <body className="custom-scrollbar overflow-x-hidden bg-background text-on-background font-body-md">
        <Navigation />
        <div className="pt-20">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
