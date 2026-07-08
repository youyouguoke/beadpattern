"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService, AdminCategory } from "@/lib/adminService";

export default function CategoryEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [item, setItem] = useState<Partial<AdminCategory>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === "new") {
      setItem({ name: "", slug: "", icon: "", displayOrder: 0 });
    } else {
      adminService.getCategory(id).then(setItem);
    }
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      if (id === "new") {
        await adminService.createCategory(item);
      } else {
        await adminService.updateCategory(id, item);
      }
      router.push("/admin/categories");
    } finally {
      setSaving(false);
    }
  };

  if (!item.name && id !== "new") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">{id === "new" ? "Create Category" : "Edit Category"}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/categories")} className="px-4 py-2 rounded-xl text-sm border border-secondary-container hover:bg-surface-container">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white hover:bg-primary disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4 max-w-2xl">
        <div>
          <label className="text-sm font-medium text-secondary">Name</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={item.name || ""} onChange={(e) => setItem({ ...item, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Slug</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={item.slug || ""} onChange={(e) => setItem({ ...item, slug: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Icon</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="Material icon name, e.g. pets" value={item.icon || ""} onChange={(e) => setItem({ ...item, icon: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Display Order</label>
          <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={item.displayOrder ?? 0} onChange={(e) => setItem({ ...item, displayOrder: Number(e.target.value) })} />
        </div>
      </div>
    </div>
  );
}
