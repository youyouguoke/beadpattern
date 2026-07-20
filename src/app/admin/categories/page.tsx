"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminCategory } from "@/lib/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    adminService.listCategories({ q }).then((res: any) => {
      setItems(res.data || []);
      setLoading(false);
    });
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
      <AdminPageHeader
        title="Categories"
        description="Manage pattern categories and their display order."
        actions={
          <AdminButton href="/admin/categories/new">
            <span className="material-symbols-outlined text-base">add</span>
            Create Category
          </AdminButton>
        }
      />

      <AdminCard>
        <input
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant w-full sm:w-80"
          placeholder="Search categories..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </AdminCard>

      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <AdminSkeleton count={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Icon</th>
                  <th className="px-4 py-3">Patterns</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{c.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{c.slug}</td>
                    <td className="px-4 py-3">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">{c.icon || "label"}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface">{c.count ?? 0}</td>
                    <td className="px-4 py-3 text-on-surface">{c.displayOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton onClick={() => router.push(`/admin/categories/${c.id}`)} variant="ghost">
                        Edit
                      </AdminButton>
                      <AdminButton onClick={() => remove(c.id)} variant="ghost" className="text-error hover:text-error">
                        Delete
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
