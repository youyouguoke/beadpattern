"use client";

import Link from "next/link";

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
            AI-generated Perler bead patterns for hobbyists, educators, and makers. Turn any idea into a printable PDF template in seconds.
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

        <div className="space-y-3">
          <h4 className="font-headline-md text-body-md text-on-surface">Popular Patterns</h4>
          <nav className="flex flex-col gap-2">
            <Link href="/pattern/cute-frog" className="text-secondary hover:text-primary transition-colors font-body-md">Cute Frog</Link>
            <Link href="/pattern/kawaii-cat" className="text-secondary hover:text-primary transition-colors font-body-md">Kawaii Cat</Link>
            <Link href="/pattern/ghost-pattern" className="text-secondary hover:text-primary transition-colors font-body-md">Ghost Pattern</Link>
            <Link href="/pattern/christmas-penguin" className="text-secondary hover:text-primary transition-colors font-body-md">Christmas Penguin</Link>
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="font-headline-md text-body-md text-on-surface">Popular Categories</h4>
          <nav className="flex flex-col gap-2">
            <Link href="/category/animals" className="text-secondary hover:text-primary transition-colors font-body-md">Animals</Link>
            <Link href="/category/kawaii" className="text-secondary hover:text-primary transition-colors font-body-md">Kawaii</Link>
            <Link href="/category/halloween" className="text-secondary hover:text-primary transition-colors font-body-md">Halloween</Link>
            <Link href="/category/christmas" className="text-secondary hover:text-primary transition-colors font-body-md">Christmas</Link>
            <Link href="/category/food" className="text-secondary hover:text-primary transition-colors font-body-md">Food</Link>
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="font-headline-md text-body-md text-on-surface">Resources</h4>
          <nav className="flex flex-col gap-2">
            <Link href="/guides" className="text-secondary hover:text-primary transition-colors font-body-md">Guides</Link>
            <Link href="/color-palettes" className="text-secondary hover:text-primary transition-colors font-body-md">Color Palettes</Link>
            <Link href="/seasonal" className="text-secondary hover:text-primary transition-colors font-body-md">Seasonal</Link>
            <Link href="/about" className="text-secondary hover:text-primary transition-colors font-body-md">About</Link>
            <Link href="/contact" className="text-secondary hover:text-primary transition-colors font-body-md">Contact</Link>
            <Link href="/privacy" className="text-secondary hover:text-primary transition-colors font-body-md">Privacy</Link>
          </nav>
        </div>
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
