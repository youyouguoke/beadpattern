"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminService, AdminPattern } from "@/lib/adminService";

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<AdminPattern[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ status: "", difficulty: "", q: "" });
  const router = useRouter();

  const load = useCallback(() => {
    adminService.listPatterns(filters).then((res: any) => setPatterns(res.data || []));
  }, [filters]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Patterns</h1>
        <Link href="/admin/patterns/new" className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary transition">
          + Create Pattern
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-4 flex flex-wrap gap-3">
        <input
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-container"
          placeholder="Search patterns..."
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          className="border border-secondary-container rounded-xl px-3 py-2 text-sm outline-none"
          value={filters.difficulty}
          onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
        >
          <option value="">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={bulkPublish} className="px-3 py-2 rounded-xl text-sm bg-green-100 text-green-800">Publish</button>
            <button onClick={bulkArchive} className="px-3 py-2 rounded-xl text-sm bg-yellow-100 text-yellow-800">Archive</button>
            <button onClick={bulkDelete} className="px-3 py-2 rounded-xl text-sm bg-red-100 text-red-800">Delete</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs">
            <tr>
              <th className="px-4 py-3"><input type="checkbox" checked={selected.size === patterns.length && patterns.length > 0} onChange={toggleAll} /></th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Downloads</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-container">
            {patterns.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-medium">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{p.difficulty}</td>
                <td className="px-4 py-3">{p.downloads}</td>
                <td className="px-4 py-3">{p.views}</td>
                <td className="px-4 py-3 text-secondary">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === "published" ? "bg-green-100 text-green-800" : p.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.healthScore >= 80 ? "bg-green-100 text-green-800" : p.healthScore >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                    {p.healthScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => router.push(`/admin/patterns/${p.id}`)} className="text-primary-container hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
