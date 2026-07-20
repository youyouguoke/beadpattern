"use client";

import { useState } from "react";
import { adminService } from "@/lib/adminService";

export default function SitemapPage() {
  const [lastGenerated, setLastGenerated] = useState("2025-06-10 08:00:00");
  const stats = { patterns: 12, collections: 3, tags: 4 };

  const regenerate = async () => {
    await adminService.regenerateSitemap();
    setLastGenerated(new Date().toLocaleString());
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display-md text-2xl text-primary">Sitemap</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
          <p className="text-sm text-on-surface-variant">Patterns</p>
          <p className="text-2xl font-bold">{stats.patterns}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
          <p className="text-sm text-on-surface-variant">Collections</p>
          <p className="text-2xl font-bold">{stats.collections}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
          <p className="text-sm text-on-surface-variant">Tags</p>
          <p className="text-2xl font-bold">{stats.tags}</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5 flex items-center justify-between">
        <div>
          <p className="font-medium">Last Generated</p>
          <p className="text-sm text-on-surface-variant">{lastGenerated}</p>
        </div>
        <button onClick={regenerate} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Regenerate</button>
      </div>
    </div>
  );
}
