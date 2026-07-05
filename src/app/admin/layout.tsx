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
      <aside className="w-64 bg-surface-container border-r border-secondary-container fixed inset-y-0 left-0 z-40 overflow-y-auto">
        <div className="p-4 border-b border-secondary-container">
          <Link href="/admin" className="font-display-md text-lg text-primary-container">
            BeadPatternAI Studio
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {menu.map((item) =>
            item.children ? (
              <div key={item.name}>
                <button
                  onClick={() => setOpen((prev) => ({ ...prev, [item.name]: !prev[item.name] }))}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-container-high text-on-surface"
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
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${
                          isActive(child.href)
                            ? "bg-primary-container text-white"
                            : "text-secondary hover:bg-surface-container-high"
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
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive(item.href!)
                    ? "bg-primary-container text-white"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.name}
              </Link>
            )
          )}
        </nav>
      </aside>

      <div className="flex-1 ml-64">
        <header className="h-16 bg-surface border-b border-secondary-container flex items-center justify-end px-6 gap-4">
          <span className="text-sm text-secondary">Admin</span>
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-sm font-medium">
            A
          </div>
        </header>
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
