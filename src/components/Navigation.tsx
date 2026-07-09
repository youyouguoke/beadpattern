"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Patterns", href: "/patterns" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
  { label: "Ideas", href: "/inspiration" },
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
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <nav className="max-w-[1280px] mx-auto flex justify-between items-center px-4 md:px-12 h-20">
        <Link href="/" className="font-display-lg text-[28px] text-primary tracking-tight font-extrabold">
          BeadPatternAI
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-primary font-bold border-b-2 border-primary pb-1 font-label-lg text-label-lg"
                  : "text-on-surface-variant hover:text-primary transition-colors font-label-lg text-label-lg"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
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
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  "block px-4 py-3 rounded-lg font-label-lg text-label-lg " +
                  (isActive(link.href)
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary")
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
