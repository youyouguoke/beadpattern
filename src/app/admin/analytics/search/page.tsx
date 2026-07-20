"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/adminService";

export default function SearchAnalyticsPage() {
  const [trends, setTrends] = useState<{ term: string; count: number }[]>([]);

  useEffect(() => {
    adminService.getDashboardStats().then((s) => setTrends(s.searchTrends));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display-md text-2xl text-primary">Search Keywords</h1>
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
        <div className="space-y-4">
          {trends.map((t) => (
            <div key={t.term} className="flex items-center gap-4">
              <span className="w-32 font-medium">{t.term}</span>
              <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min((t.count / 120) * 100, 100)}%` }} />
              </div>
              <span className="w-12 text-right text-sm text-on-surface-variant">{t.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
