"use client";

import { useEffect, useState } from "react";
import { adminService, AdminPattern } from "@/lib/adminService";

export default function PatternAnalyticsPage() {
  const [patterns, setPatterns] = useState<AdminPattern[]>([]);
  const [days, setDays] = useState<7 | 30 | 90>(7);

  useEffect(() => { adminService.listPatterns().then((res: any) => setPatterns(res.data || [])); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Pattern Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d as 7 | 30 | 90)} className={`px-3 py-1 rounded-lg text-sm ${days === d ? "bg-primary-container text-white" : "border border-secondary-container"}`}>
              {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary"><tr><th className="px-4 py-3">Pattern</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Downloads</th><th className="px-4 py-3">Likes</th><th className="px-4 py-3">CTR%</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {patterns.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{p.emoji} {p.title}</td>
                <td className="px-4 py-3">{p.views}</td>
                <td className="px-4 py-3">{p.downloads}</td>
                <td className="px-4 py-3">{p.likes}</td>
                <td className="px-4 py-3">{((Number(p.downloads) / Math.max(p.views, 1)) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
