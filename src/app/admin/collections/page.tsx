"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminCollection } from "@/lib/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

export default function CollectionsPage() {
  const [items, setItems] = useState<AdminCollection[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    adminService.listCollections({ q }).then((res: any) => {
      setItems(res.data || []);
      setLoading(false);
    });
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
      <AdminPageHeader
        title="Collections"
        description="Manage curated collections and seasonal groups."
        actions={
          <AdminButton href="/admin/collections/new">
            <span className="material-symbols-outlined text-base">add</span>
            Create Collection
          </AdminButton>
        }
      />

      <AdminCard>
        <input
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant w-full sm:w-80"
          placeholder="Search collections..."
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
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Patterns</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{c.title}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{c.slug}</td>
                    <td className="px-4 py-3 text-on-surface">{c.patternCount ?? 0}</td>
                    <td className="px-4 py-3 text-on-surface">{c.displayOrder}</td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={c.published ? "success" : "neutral"}>
                        {c.published ? "Yes" : "No"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton onClick={() => router.push(`/admin/collections/${c.id}`)} variant="ghost">
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
