"use client";

import { useEffect, useState } from "react";
import { adminService, AdminSubscriber } from "@/lib/adminService";

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);

  useEffect(() => { adminService.listSubscribers().then((res) => setSubscribers(res.data)); }, []);

  const exportCSV = async () => {
    const csv = await adminService.exportSubscribers();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSub = async (id: string) => {
    await adminService.deleteSubscriber(id);
    adminService.listSubscribers().then((res) => setSubscribers(res.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">Newsletter Subscribers</h1>
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Export CSV</button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-on-surface-variant"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Subscribed At</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-surface-container">{s.source}</span></td>
                <td className="px-4 py-3 text-on-surface-variant">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => deleteSub(s.id)} className="text-error text-sm hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
