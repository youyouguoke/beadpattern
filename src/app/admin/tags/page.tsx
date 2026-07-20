"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminTag } from "@/lib/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

export default function TagsPage() {
  const [items, setItems] = useState<AdminTag[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    adminService.listTags({ limit: 100 }).then((res: any) => {
      setItems(res.data || []);
      setLoading(false);
    });
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
      <AdminPageHeader
        title="Tags"
        description="Manage tags used for filtering and search."
        actions={
          <AdminButton href="/admin/tags/new">
            <span className="material-symbols-outlined text-base">add</span>
            Create Tag
          </AdminButton>
        }
      />

      <AdminCard>
        <input
          className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant w-full sm:w-80"
          placeholder="Search tags..."
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
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Patterns</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{t.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{t.slug}</td>
                    <td className="px-4 py-3 text-on-surface">{t.type}</td>
                    <td className="px-4 py-3 text-on-surface">{t.patternCount ?? 0}</td>
                    <td className="px-4 py-3 text-on-surface">{t.displayOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton onClick={() => router.push(`/admin/tags/${t.id}`)} variant="ghost">
                        Edit
                      </AdminButton>
                      <AdminButton onClick={() => remove(t.id)} variant="ghost" className="text-error hover:text-error">
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
