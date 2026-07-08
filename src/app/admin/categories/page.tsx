"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminCategory } from "@/lib/adminService";

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [q, setQ] = useState("");
  const router = useRouter();

  const load = useCallback(() => {
    adminService.listCategories({ q }).then((res: any) => setItems(res.data || []));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await adminService.deleteCategory(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Categories</h1>
        <Link href="/admin/categories/new" className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition">
          + Create Category
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-4 flex gap-3">
        <input
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-container"
          placeholder="Search categories..."
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
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Patterns</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-container">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-secondary">{c.slug}</td>
                <td className="px-4 py-3"><span className="material-symbols-outlined text-lg">{c.icon || "label"}</span></td>
                <td className="px-4 py-3">{c.count}</td>
                <td className="px-4 py-3">{c.displayOrder}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => router.push(`/admin/categories/${c.id}`)} className="text-primary-container hover:underline">Edit</button>
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
