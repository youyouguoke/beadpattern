"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService, AdminTag } from "@/lib/adminService";
import type { TagType } from "@/types";

const TAG_TYPES: TagType[] = ["style", "theme", "difficulty", "animal", "object", "color", "season", "character"];

export default function TagEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [item, setItem] = useState<Partial<AdminTag>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === "new") {
      setItem({ name: "", slug: "", type: "theme", displayOrder: 0, popularity: 0 });
    } else {
      adminService.getTag(id).then(setItem);
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      if (id === "new") {
        await adminService.createTag(item);
      } else {
        await adminService.updateTag(id, item);
      }
      router.push("/admin/tags");
    } finally {
      setSaving(false);
    }
  };

  if (!item.name && id !== "new") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">{id === "new" ? "Create Tag" : "Edit Tag"}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/tags")} className="px-4 py-2 rounded-xl text-sm border border-outline-variant/20 hover:bg-surface-container-low-container">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm bg-primary text-white hover:bg-primary disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Name</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.name || ""} onChange={(e) => setItem({ ...item, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Slug</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.slug || ""} onChange={(e) => setItem({ ...item, slug: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Type</label>
          <select className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={(item.type as TagType) || "theme"} onChange={(e) => setItem({ ...item, type: e.target.value as TagType })}>
            {TAG_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-on-surface-variant">Display Order</label>
            <input type="number" className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.displayOrder ?? 0} onChange={(e) => setItem({ ...item, displayOrder: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface-variant">Popularity</label>
            <input type="number" className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={item.popularity ?? 0} onChange={(e) => setItem({ ...item, popularity: Number(e.target.value) })} />
          </div>
        </div>
      </div>
    </div>
  );
}
