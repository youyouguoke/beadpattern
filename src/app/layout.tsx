import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "BeadPatternAI | AI Perler Bead Pattern Generator",
  description: "Create, discover and download beautiful AI-generated Perler bead patterns. Generate printable PDF templates and pixel art designs instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap&family=Quicksand:wght@700&display=swap&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />

        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-NKBPE63232"
        />
        <script
          id="ga-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NKBPE63232', { send_page_view: true });
              gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
              });
              if (window.location.search.includes('ga-debug')) {
                console.log('[GA] page_view sent to G-NKBPE63232');
              }
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
