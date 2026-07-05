"use client";

import { useEffect, useState } from "react";
import { adminService, AdminCategory } from "@/lib/adminService";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);

  useEffect(() => { adminService.listCategories().then(setCategories); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) await adminService.updateCategory(editing.id, editing);
    else await adminService.createCategory(editing);
    setEditing(null);
    adminService.listCategories().then(setCategories);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Categories</h1>
        <button onClick={() => setEditing({ name: "", slug: "", icon: "label", count: 0 })} className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium">+ Category</button>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Icon</th><th className="px-4 py-3">Patterns</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-secondary">{c.slug}</td>
                <td className="px-4 py-3">{c.icon}</td>
                <td className="px-4 py-3">{c.count}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(c)} className="text-primary-container text-sm hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display-md text-lg">{editing.id ? "Edit Category" : "New Category"}</h2>
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Material Icon" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm border border-secondary-container">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
