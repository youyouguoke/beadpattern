"use client";

import { useEffect, useState } from "react";
import { adminService, AdminTag } from "@/lib/adminService";

export default function TagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [editing, setEditing] = useState<Partial<AdminTag> | null>(null);
  const [mergeSource, setMergeSource] = useState<string | null>(null);

  useEffect(() => { adminService.listTags().then(setTags); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) await adminService.updateTag(editing.id, editing);
    else await adminService.createTag(editing);
    setEditing(null);
    adminService.listTags().then(setTags);
  };

  const deleteTag = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    await adminService.deleteTag(id);
    adminService.listTags().then(setTags);
  };

  const merge = async (targetId: string) => {
    if (!mergeSource) return;
    await adminService.mergeTags(mergeSource, targetId);
    setMergeSource(null);
    adminService.listTags().then(setTags);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Tags</h1>
        <button onClick={() => setEditing({ name: "", slug: "", popularity: 0, patternCount: 0 })} className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium">+ Tag</button>
      </div>

      {mergeSource && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm flex items-center justify-between">
          <span>Merge mode: select target tag</span>
          <button onClick={() => setMergeSource(null)} className="text-secondary hover:underline">Cancel</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-secondary uppercase text-xs"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Popularity</th><th className="px-4 py-3">Patterns</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {tags.map((t) => (
              <tr key={t.id} className="hover:bg-surface-container/50">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-secondary">{t.slug}</td>
                <td className="px-4 py-3">{t.popularity}</td>
                <td className="px-4 py-3">{t.patternCount}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  {mergeSource === t.id ? <span className="text-yellow-700 text-sm">Source</span> : (
                    <>
                      <button onClick={() => setEditing(t)} className="text-primary-container text-sm hover:underline">Edit</button>
                      <button onClick={() => setMergeSource(t.id)} className="text-secondary text-sm hover:underline">Merge</button>
                      {mergeSource && <button onClick={() => merge(t.id)} className="text-green-700 text-sm hover:underline">Target</button>}
                      <button onClick={() => deleteTag(t.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display-md text-lg">{editing.id ? "Edit Tag" : "New Tag"}</h2>
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
            <input className="w-full border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
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
