"use client";

import { useEffect, useState } from "react";
import { adminService, AdminMedia } from "@/lib/adminService";

const FOLDERS = ["All", "Pattern Covers", "Finished", "Step Images", "Gallery"];

export default function MediaPage() {
  const [folder, setFolder] = useState("All");
  const [media, setMedia] = useState<AdminMedia[]>([]);

  useEffect(() => { adminService.listMedia({ folder: folder === "All" ? undefined : folder }).then((res) => setMedia(res.data)); }, [folder]);

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    await adminService.deleteMedia(id);
    adminService.listMedia({ folder: folder === "All" ? undefined : folder }).then((res) => setMedia(res.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Media Library</h1>
        <button className="bg-primary-container text-white px-4 py-2 rounded-xl text-sm font-medium">+ Upload</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FOLDERS.map((f) => (
          <button key={f} onClick={() => setFolder(f)} className={`px-4 py-2 rounded-xl text-sm border ${folder === f ? "bg-primary-container text-white border-primary-container" : "border-secondary-container text-secondary"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-secondary-container p-3">
            <div className="aspect-square rounded-xl bg-surface-container overflow-hidden mb-3">
              <img src={m.thumbnail} alt={m.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-medium truncate">{m.name}</p>
            <p className="text-xs text-secondary">{Math.round(m.size / 1024)} KB · {m.width}x{m.height}</p>
            <p className="text-xs text-secondary">{m.folder}</p>
            <button onClick={() => deleteMedia(m.id)} className="text-red-600 text-xs mt-2 hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
