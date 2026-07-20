"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService } from "@/lib/adminService";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { PatternStatusBadge } from "@/components/admin/PatternStatusBadge";
import { AuditStatusBadge } from "@/components/admin/AuditStatusBadge";
import { GridStatusBadge } from "@/components/admin/GridStatusBadge";
import type { Pattern } from "@/types";

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ status: "", gridStatus: "", seoReady: "", difficulty: "", q: "" });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    adminService.listPatterns({ ...filters, page: meta.page, limit: meta.limit }).then((res) => {
      setPatterns(res.data);
      setMeta(res.meta);
      setLoading(false);
    });
  }, [filters, meta.page, meta.limit]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAll = () => {
    if (selected.size === patterns.length) setSelected(new Set());
    else setSelected(new Set(patterns.map((p) => p.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const bulkPublish = async () => {
    await adminService.bulkPublish(Array.from(selected));
    setSelected(new Set());
    load();
  };

  const bulkArchive = async () => {
    await adminService.bulkArchive(Array.from(selected));
    setSelected(new Set());
    load();
  };

  const bulkDelete = async () => {
    if (!confirm("Delete selected patterns?")) return;
    await adminService.bulkDelete(Array.from(selected));
    setSelected(new Set());
    load();
  };

  const filterInput = (placeholder: string, value: string, onChange: (v: string) => void) => (
    <input
      className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  const filterSelect = (value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <select
      className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-on-surface"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Patterns"
        description="Manage, edit, and publish your Perler bead pattern library."
        actions={
          <>
            <AdminButton href="/admin/bulk-import/seed" variant="secondary">
              <span className="material-symbols-outlined text-base">upload_file</span>
              Seed Import
            </AdminButton>
            <AdminButton href="/admin/patterns/new">
              <span className="material-symbols-outlined text-base">add</span>
              Create Pattern
            </AdminButton>
          </>
        }
      />

      <AdminCard
        title={selected.size > 0 ? `${selected.size} selected` : undefined}
        action={
          selected.size > 0 ? (
            <div className="flex gap-2">
              <AdminButton onClick={bulkPublish} variant="secondary">Publish</AdminButton>
              <AdminButton onClick={bulkArchive} variant="secondary">Archive</AdminButton>
              <AdminButton onClick={bulkDelete} variant="danger">Delete</AdminButton>
            </div>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-3">
          {filterInput("Search patterns...", filters.q, (v) => setFilters((f) => ({ ...f, q: v })))}
          {filterSelect(filters.status, (v) => setFilters((f) => ({ ...f, status: v })), [
            { value: "", label: "All Status" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ])}
          {filterSelect(filters.gridStatus, (v) => setFilters((f) => ({ ...f, gridStatus: v })), [
            { value: "", label: "All Grid" },
            { value: "ready", label: "Ready" },
            { value: "review", label: "Review" },
            { value: "designing", label: "Designing" },
            { value: "missing", label: "Missing" },
          ])}
          {filterSelect(filters.seoReady, (v) => setFilters((f) => ({ ...f, seoReady: v })), [
            { value: "", label: "All SEO" },
            { value: "true", label: "Ready" },
            { value: "false", label: "Not Ready" },
          ])}
          {filterSelect(filters.difficulty, (v) => setFilters((f) => ({ ...f, difficulty: v })), [
            { value: "", label: "All Difficulty" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ])}
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <AdminSkeleton count={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-xs">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === patterns.length && patterns.length > 0} onChange={toggleAll} /></th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Grid</th>
                  <th className="px-4 py-3">SEO Priority</th>
                  <th className="px-4 py-3">Publish #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Audit</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {patterns.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low-container-low/50 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.emoji}</span>
                        <div>
                          <div className="font-medium text-on-surface">{p.title}</div>
                          <div className="text-xs text-on-surface-variant">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface">{p.difficulty}</td>
                    <td className="px-4 py-3"><GridStatusBadge status={p.gridStatus} /></td>
                    <td className="px-4 py-3 text-on-surface">{p.seoPriority}</td>
                    <td className="px-4 py-3 text-on-surface">{p.publishOrder}</td>
                    <td className="px-4 py-3"><PatternStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3"><AuditStatusBadge score={p.healthScore ?? 0} audit={p.audit} /></td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton onClick={() => router.push(`/admin/patterns/${p.id}`)} variant="ghost" className="!p-0">
                        Edit
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setMeta((m) => ({ ...m, page }))}
              className={`px-3 py-1 rounded-xl text-sm font-bold transition-colors ${
                meta.page === page
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low-container"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-on-surface-variant">{meta.total} patterns total · Page {meta.page} of {meta.totalPages}</p>
    </div>
  );
}
