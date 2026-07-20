"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "Dashboard", href: "/admin", icon: "dashboard" },
  {
    name: "Content",
    icon: "folder",
    children: [
      { name: "Patterns", href: "/admin/patterns", icon: "grid_on" },
      { name: "Collections", href: "/admin/collections", icon: "collections" },
      { name: "Categories", href: "/admin/categories", icon: "label" },
      { name: "Tags", href: "/admin/tags", icon: "sell" },
    ],
  },
  {
    name: "Assets",
    icon: "perm_media",
    children: [
      { name: "Media", href: "/admin/media", icon: "image" },
      { name: "Bulk Import", href: "/admin/bulk-import", icon: "upload_file" },
    ],
  },
  {
    name: "SEO",
    icon: "search",
    children: [
      { name: "Sitemap", href: "/admin/seo/sitemap", icon: "sitemap" },
      { name: "Redirects", href: "/admin/seo/redirects", icon: "sync_alt" },
      { name: "Metadata", href: "/admin/seo/metadata", icon: "tune" },
    ],
  },
  {
    name: "Analytics",
    icon: "insights",
    children: [
      { name: "Pattern Stats", href: "/admin/analytics/patterns", icon: "bar_chart" },
      { name: "Search Keywords", href: "/admin/analytics/search", icon: "query_stats" },
    ],
  },
  {
    name: "System",
    icon: "settings",
    children: [
      { name: "Newsletter", href: "/admin/newsletter", icon: "mail" },
      { name: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({
    Content: true,
    Assets: true,
    SEO: true,
    Analytics: true,
    System: true,
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-lowest border-r border-outline-variant/30 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <Link href="/admin" className="font-quicksand font-bold text-xl text-primary">
            BeadPatternAI Studio
          </Link>
          <button
            className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low-container"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {menu.map((item) =>
            item.children ? (
              <div key={item.name}>
                <button
                  onClick={() => setOpen((prev) => ({ ...prev, [item.name]: !prev[item.name] }))}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-surface-container-low-container text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.name}
                  <span className="material-symbols-outlined ml-auto">
                    {open[item.name] ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {open[item.name] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors ${
                          isActive(child.href)
                            ? "bg-primary text-on-primary font-bold"
                            : "text-on-surface-variant hover:bg-surface-container-low-container hover:text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{child.icon}</span>
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl transition-colors ${
                  isActive(item.href!)
                    ? "bg-primary text-on-primary"
                    : "text-on-surface hover:bg-surface-container-low-container"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.name}
              </Link>
            )
          )}
        </nav>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="h-16 bg-surface border-b border-outline-variant/30 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low-container-low"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant hidden sm:inline">Admin Console</span>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
              A
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
