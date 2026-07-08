"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminTag } from "@/lib/adminService";

export default function TagsPage() {
  const [items, setItems] = useState<AdminTag[]>([]);
  const [q, setQ] = useState("");
  const router = useRouter();

  const load = useCallback(() => {
    adminService.listTags({ limit: 100 }).then((res: any) => setItems(res.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = q ? items.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.slug.toLowerCase().includes(q.toLowerCase())) : items;

  const remove = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    await adminService.deleteTag(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Tags</h1>
        <Link href="/admin/tags/new" className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition">
          + Create Tag
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-4 flex gap-3">
        <input
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-container"
          placeholder="Search tags..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Patterns</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-container">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-secondary">{t.slug}</td>
                <td className="px-4 py-3">{t.type}</td>
                <td className="px-4 py-3">{t.patternCount}</td>
                <td className="px-4 py-3">{t.displayOrder}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => router.push(`/admin/tags/${t.id}`)} className="text-primary-container hover:underline">Edit</button>
                  <button onClick={() => remove(t.id)} className="ml-3 text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
