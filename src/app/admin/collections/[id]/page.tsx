"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService, AdminCollection } from "@/lib/adminService";

export default function CollectionEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [item, setItem] = useState<Partial<AdminCollection>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === "new") {
      setItem({ title: "", slug: "", description: "", published: false, displayOrder: 0, patternCount: 0 });
    } else {
      adminService.getCollection(id).then(setItem);
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      if (id === "new") {
        await adminService.createCollection(item);
      } else {
        await adminService.updateCollection(id, item);
      }
      router.push("/admin/collections");
    } finally {
      setSaving(false);
    }
  };

  if (!item.title && id !== "new") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">{id === "new" ? "Create Collection" : "Edit Collection"}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/collections")} className="px-4 py-2 rounded-xl text-sm border border-outline-variant/20 hover:bg-surface-container-low-container">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm bg-primary text-white hover:bg-primary disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Title</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.title || ""} onChange={(e) => setItem({ ...item, title: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Slug</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.slug || ""} onChange={(e) => setItem({ ...item, slug: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Description</label>
          <textarea className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm min-h-[80px]" value={item.description || ""} onChange={(e) => setItem({ ...item, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-on-surface-variant">Display Order</label>
            <input type="number" className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.displayOrder ?? 0} onChange={(e) => setItem({ ...item, displayOrder: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="published" type="checkbox" checked={!!item.published} onChange={(e) => setItem({ ...item, published: e.target.checked })} />
            <label htmlFor="published" className="text-sm font-medium text-on-surface-variant">Published</label>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Banner URL</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.banner || ""} onChange={(e) => setItem({ ...item, banner: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
