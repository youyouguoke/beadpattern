"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService, AdminDashboardStats } from "@/lib/adminService";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    adminService.getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  const cards = [
    { label: "Published", value: stats.patterns.published, color: "bg-green-100 text-green-800" },
    { label: "Draft", value: stats.patterns.draft, color: "bg-yellow-100 text-yellow-800" },
    { label: "Archived", value: stats.patterns.archived, color: "bg-gray-100 text-gray-800" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display-md text-2xl text-primary-container">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.color}`}>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
        <Link href="/admin/collections" className="rounded-2xl p-5 bg-white border border-secondary-container hover:shadow-sm transition">
          <p className="text-sm text-secondary">Collections</p>
          <p className="text-3xl font-bold mt-1">{stats.collections}</p>
        </Link>
        <Link href="/admin/tags" className="rounded-2xl p-5 bg-white border border-secondary-container hover:shadow-sm transition">
          <p className="text-sm text-secondary">Tags</p>
          <p className="text-3xl font-bold mt-1">{stats.tags}</p>
        </Link>
        <Link href="/admin/media" className="rounded-2xl p-5 bg-white border border-secondary-container hover:shadow-sm transition">
          <p className="text-sm text-secondary">Images</p>
          <p className="text-3xl font-bold mt-1">{stats.media}</p>
        </Link>
        <Link href="/admin/bulk-import" className="rounded-2xl p-5 bg-white border border-secondary-container hover:shadow-sm transition">
          <p className="text-sm text-secondary">Bulk Jobs</p>
          <p className="text-3xl font-bold mt-1">{stats.bulkJobs}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-secondary-container p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-lg">Latest Patterns</h2>
            <Link href="/admin/patterns" className="text-sm text-primary-container">View All</Link>
          </div>
          <div className="divide-y divide-secondary-container">
            {stats.latestPatterns.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-secondary">{p.status} · {p.difficulty} · {p.grid}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-secondary-container p-5">
            <h2 className="font-headline-md text-lg mb-4">Google Index Count</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Indexed</span>
                <span className="font-medium">{stats.googleIndex.indexed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Submitted</span>
                <span className="font-medium">{stats.googleIndex.submitted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Pending</span>
                <span className="font-medium">{stats.googleIndex.pending}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-secondary-container p-5">
            <h2 className="font-headline-md text-lg mb-4">Top Downloaded</h2>
            <div className="space-y-3">
              {stats.topDownloaded.map((p) => (
                <div key={p.slug} className="flex justify-between text-sm">
                  <span className="truncate max-w-[160px]">{p.title}</span>
                  <span className="font-medium">{p.downloads}</span>
                </div>
              ))}
            </div>
          </div>

          {stats.health && (
            <div className="bg-white rounded-2xl border border-secondary-container p-5">
              <h2 className="font-headline-md text-lg mb-4">Data Health</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Total Patterns</span>
                  <span className="font-medium">{stats.health.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Missing Grid</span>
                  <span className="font-medium text-red-600">{stats.health.missingGrid}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Missing Cover</span>
                  <span className="font-medium text-red-600">{stats.health.missingCover}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Missing FAQ</span>
                  <span className="font-medium text-yellow-600">{stats.health.missingFaq}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Missing Related</span>
                  <span className="font-medium text-yellow-600">{stats.health.missingRelated}</span>
                </div>
              </div>
              <Link href="/admin/patterns" className="inline-block mt-4 text-sm text-primary-container">Review Patterns</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
