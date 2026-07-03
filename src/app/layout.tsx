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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Quicksand:wght@700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />

        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y34VHCG3N2"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Y34VHCG3N2');
            `,
          }}
        />

        {/* Plausible Analytics */}
        <script
          defer
          data-domain="beadpatternai.com"
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
