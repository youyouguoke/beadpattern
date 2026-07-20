"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService, AdminDashboardStats } from "@/lib/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    adminService.getDashboardStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Dashboard" description="Overview of your BeadPatternAI content and SEO health." />
        <AdminSkeleton count={4} />
      </div>
    );
  }

  const statusCards = [
    { label: "Published", value: stats.patterns.published, variant: "success" as const },
    { label: "Draft", value: stats.patterns.draft, variant: "warning" as const },
    { label: "Archived", value: stats.patterns.archived, variant: "neutral" as const },
  ];

  const entityCards = [
    { label: "Collections", value: stats.collections, href: "/admin/collections" },
    { label: "Tags", value: stats.tags, href: "/admin/tags" },
    { label: "Images", value: stats.media, href: "/admin/media" },
    { label: "Bulk Jobs", value: stats.bulkJobs, href: "/admin/bulk-import" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your BeadPatternAI content and SEO health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((c) => (
          <AdminCard key={c.label} className="flex items-center justify-between">
            <div>
              <p className="text-label-sm text-on-surface-variant mb-1">{c.label}</p>
              <p className="font-quicksand font-bold text-headline-lg text-on-surface">{c.value}</p>
            </div>
            <AdminBadge variant={c.variant}>Patterns</AdminBadge>
          </AdminCard>
        ))}
        {entityCards.map((c) => (
          <Link key={c.label} href={c.href} className="block">
            <AdminCard className="hover:border-primary/30 transition-colors">
              <p className="text-label-sm text-on-surface-variant mb-1">{c.label}</p>
              <p className="font-quicksand font-bold text-headline-lg text-on-surface">{c.value}</p>
            </AdminCard>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard title="Latest Patterns" className="lg:col-span-2" action={
          <Link href="/admin/patterns" className="text-sm text-primary hover:underline">View All</Link>
        }>
          <div className="divide-y divide-outline-variant/20">
            {stats.latestPatterns.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <p className="font-medium text-on-surface">{p.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {p.status} · {p.difficulty} · {p.grid}
                    </p>
                  </div>
                </div>
                <AdminBadge variant={p.status === "published" ? "success" : "warning"}>
                  {p.status}
                </AdminBadge>
              </div>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Google Index Count">
            <div className="space-y-3">
              {[
                { label: "Indexed", value: stats.googleIndex.indexed },
                { label: "Submitted", value: stats.googleIndex.submitted },
                { label: "Pending", value: stats.googleIndex.pending },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{item.label}</span>
                  <span className="font-medium text-on-surface">{item.value}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Top Downloaded">
            <div className="space-y-3">
              {stats.topDownloaded.map((p) => (
                <div key={p.slug} className="flex justify-between text-sm">
                  <span className="truncate max-w-[160px] text-on-surface">{p.title}</span>
                  <span className="font-medium text-on-surface-variant">{p.downloads}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          {stats.health && (
            <AdminCard title="Data Health">
              <div className="space-y-3">
                {[
                  { label: "Total Patterns", value: stats.health.total, variant: "neutral" as const },
                  { label: "Missing Grid", value: stats.health.missingGrid, variant: "error" as const },
                  { label: "Missing Cover", value: stats.health.missingCover, variant: "error" as const },
                  { label: "Missing FAQ", value: stats.health.missingFaq, variant: "warning" as const },
                  { label: "Missing Related", value: stats.health.missingRelated, variant: "warning" as const },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm items-center">
                    <span className="text-on-surface-variant">{item.label}</span>
                    <AdminBadge variant={item.variant}>{item.value}</AdminBadge>
                  </div>
                ))}
              </div>
              <Link href="/admin/patterns" className="inline-block mt-4 text-sm text-primary hover:underline">
                Review Patterns
              </Link>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
