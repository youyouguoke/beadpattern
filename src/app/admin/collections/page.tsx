"use client";

import { useEffect, useState } from "react";
import { adminService, AdminCollection } from "@/lib/adminService";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [editing, setEditing] = useState<Partial<AdminCollection> | null>(null);

  useEffect(() => { adminService.listCollections().then(setCollections); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) await adminService.updateCollection(editing.id, editing);
    else await adminService.createCollection(editing);
    setEditing(null);
    adminService.listCollections().then(setCollections);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Collections</h1>
        <button onClick={() => setEditing({ title: "", slug: "", description: "", displayOrder: 0, published: false })} className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium">+ Collection</button>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Patterns</th><th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-secondary-container">
            {collections.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 text-secondary">{c.slug}</td>
                <td className="px-4 py-3">{c.displayOrder}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${c.published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{c.published ? "Published" : "Draft"}</span></td>
                <td className="px-4 py-3">{c.patternCount}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(c)} className="text-primary-container text-sm hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display-md text-lg">{editing.id ? "Edit Collection" : "New Collection"}</h2>
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <textarea className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Description" rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <input type="number" className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Display Order" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })} />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.published || false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} id="pub" />
              <label htmlFor="pub" className="text-sm">Published</label>
            </div>
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
