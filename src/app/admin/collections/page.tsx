"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminCollection } from "@/lib/adminService";

export default function CollectionsPage() {
  const [items, setItems] = useState<AdminCollection[]>([]);
  const [q, setQ] = useState("");
  const router = useRouter();

  const load = useCallback(() => {
    adminService.listCollections({ q }).then((res: any) => setItems(res.data || []));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await adminService.deleteCollection(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Collections</h1>
        <Link href="/admin/collections/new" className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition">
          + Create Collection
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-4 flex gap-3">
        <input
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-container"
          placeholder="Search collections..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Patterns</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-container">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 text-secondary">{c.slug}</td>
                <td className="px-4 py-3">{c.patternCount}</td>
                <td className="px-4 py-3">{c.displayOrder}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {c.published ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => router.push(`/admin/collections/${c.id}`)} className="text-primary-container hover:underline">Edit</button>
                  <button onClick={() => remove(c.id)} className="ml-3 text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
