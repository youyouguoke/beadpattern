"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Patterns", href: "/patterns" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
  { label: "Inspiration", href: "/inspiration" },
  { label: "Blog", href: "/blog" },
  { label: "Generator", href: "/generate" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 glass-nav border-b border-outline-variant/30">
      <nav className="container-main flex justify-between items-center h-20">
        <Link href="/" className="font-quicksand text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight font-bold">
          BeadPatternAI
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md"
                  : "text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/generate"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors duration-200 active:scale-95"
          >
            Create Pattern
          </Link>
          <Link
            href="/search"
            className="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary flex items-center justify-center transition-colors"
            aria-label="Search"
          >
            <span className="material-symbols-outlined">search</span>
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-lg">
          <div className="container-main py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  "block px-4 py-3 rounded-lg font-label-md text-label-md " +
                  (isActive(link.href)
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
