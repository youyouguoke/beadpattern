"use client";

import { useEffect, useState } from "react";
import { adminService, AdminMetadataTemplate } from "@/lib/adminService";

export default function MetadataPage() {
  const [templates, setTemplates] = useState<AdminMetadataTemplate[]>([]);

  useEffect(() => { adminService.listMetadata().then(setTemplates); }, []);

  const update = (i: number, field: keyof AdminMetadataTemplate, value: string) => {
    const next = [...templates];
    next[i] = { ...next[i], [field]: value };
    setTemplates(next);
  };

  const save = async () => {
    await adminService.updateMetadata(templates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">Metadata Templates</h1>
        <button onClick={save} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Save Templates</button>
      </div>

      <div className="space-y-4">
        {templates.map((t, i) => (
          <div key={t.type} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
            <p className="font-medium capitalize mb-3">{t.type} Template</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-on-surface-variant">Title Template</label>
                <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={t.titleTemplate} onChange={(e) => update(i, "titleTemplate", e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant">Description Template</label>
                <textarea className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" rows={2} value={t.descriptionTemplate} onChange={(e) => update(i, "descriptionTemplate", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
