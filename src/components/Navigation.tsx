"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Patterns", href: "/pattern/cute-frog" },
  { label: "Categories", href: "/category/animals" },
  { label: "Collections", href: "/collection/halloween" },
  { label: "Ideas", href: "#inspiration" },
  { label: "Generator", href: "/generate" },
  { label: "Blog", href: "#" },
];

export default function Navigation() {
  const pathname = usePathname();

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

        <div>
          <Link
            href="/generate"
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label-lg text-label-lg hover:scale-105 transition-transform active:scale-95 shadow-sm hidden"
          >
            Create with AI
          </Link>
        </div>
      </nav>
    </header>
  );
}
