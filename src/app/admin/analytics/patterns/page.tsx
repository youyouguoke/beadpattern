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
        <h1 className="font-display-md text-2xl text-primary">Pattern Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d as 7 | 30 | 90)} className={`px-3 py-1 rounded-lg text-sm ${days === d ? "bg-primary text-white" : "border border-outline-variant/20"}`}>
              {d} Days
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-on-surface-variant"><tr><th className="px-4 py-3">Pattern</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Downloads</th><th className="px-4 py-3">Likes</th><th className="px-4 py-3">CTR%</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {patterns.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{p.emoji} {p.title}</td>
                <td className="px-4 py-3">{p.views}</td>
                <td className="px-4 py-3">{p.downloads}</td>
                <td className="px-4 py-3">{p.likes}</td>
                <td className="px-4 py-3">{((Number(p.downloads ?? 0) / Math.max(p.views ?? 1, 1)) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
