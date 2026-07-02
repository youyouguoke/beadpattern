"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Generator", href: "/generate" },
  { label: "Categories", href: "/category/kawaii" },
  { label: "Popular Patterns", href: "/pattern/cute-frog-drinking-bubble-tea" },
  { label: "Blog", href: "#" },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 glass-nav shadow-sm border-b border-secondary/20">
      <nav className="max-w-screen-2xl mx-auto flex justify-between items-center px-4 md:px-12 h-20">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-display-lg text-lg">
            BP
          </div>
          <span className="font-display-lg text-headline-md md:text-display-lg-mobile text-primary tracking-tighter">
            BeadPatternAI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-primary font-bold border-b-2 border-primary font-body-md text-body-md py-1"
                  : "text-on-surface-variant hover:text-primary-container transition-colors duration-200 font-body-md text-body-md"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/generate"
          className="bg-primary-container text-white px-4 py-2 rounded-lg font-label-sm hover:scale-105 active:scale-95 transition-all duration-200"
        >
          Generate Pattern
        </Link>
      </nav>
    </header>
  );
}
