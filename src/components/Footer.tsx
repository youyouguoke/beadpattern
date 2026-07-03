"use client";

import Link from "next/link";

const footerLinks = {
  "Popular Patterns": [
    { label: "Cute Frog", href: "/pattern/cute-frog" },
    { label: "Kawaii Cat", href: "/pattern/kawaii-cat" },
    { label: "Ghost Pattern", href: "/pattern/ghost-pattern" },
    { label: "Flower Pattern", href: "/pattern/flower" },
    { label: "Christmas Pattern", href: "/pattern/christmas-penguin" },
  ],
  "Popular Categories": [
    { label: "Animals", href: "/category/animals" },
    { label: "Kawaii", href: "/category/kawaii" },
    { label: "Halloween", href: "/category/halloween" },
    { label: "Christmas", href: "/category/christmas" },
    { label: "Food", href: "/category/food" },
    { label: "Gaming", href: "/category/gaming" },
  ],
  "Collections & Seasonal": [
    { label: "Halloween", href: "/collection/halloween" },
    { label: "Christmas", href: "/collection/christmas" },
    { label: "Cute Animals", href: "/collection/cute-animals" },
    { label: "Food Series", href: "/collection/food" },
    { label: "Beginner Patterns", href: "/collection/beginner" },
  ],
  "Create & Learn": [
    { label: "AI Pattern Generator", href: "/generate" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Printing Guide", href: "#seo" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "/privacy" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full py-16 px-4 md:px-12 bg-surface-container dark:bg-surface-container-highest">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-container flex items-center justify-center text-white font-display-lg text-sm">
              BP
            </div>
            <span className="font-display-lg text-headline-md text-primary">BeadPatternAI</span>
          </div>
          <p className="text-secondary font-body-md max-w-sm">
            The world&apos;s largest searchable library of printable Perler bead patterns. Browse, download, and create with AI.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border-2 border-secondary-container focus:border-primary px-4 py-2 bg-white outline-none"
              placeholder="email@example.com"
              type="email"
            />
            <button className="bg-primary text-white p-2 rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div className="space-y-3" key={title}>
            <h4 className="font-headline-md text-body-md text-on-surface">{title}</h4>
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-secondary hover:text-primary transition-colors font-body-md"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-surface-container-high flex flex-col md:flex-row justify-between items-center gap-4 text-secondary text-sm">
        <p>© 2024 BeadPatternAI. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
