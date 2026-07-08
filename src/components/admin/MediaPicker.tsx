"use client";

import { useEffect, useRef, useState } from "react";
import { adminService, AdminMedia } from "@/lib/adminService";

export type MediaPickerMode = "single" | "multiple";
export type MediaPickerType = "cover" | "finished" | "step" | "gallery";

interface MediaPickerProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: MediaPickerMode;
  type?: MediaPickerType;
  label?: string;
}

export default function MediaPicker({ value, onChange, mode = "single", type = "cover", label }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listMedia({ type, limit: 50 });
      setItems(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const toggle = (id: string) => {
    if (mode === "single") {
      onChange(id);
      setOpen(false);
      return;
    }
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    onChange(next);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await adminService.uploadMediaImage(file, type);
      toggle(media.id);
      setItems((prev) => [media, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selectedItems = items.filter((m) => selectedIds.includes(m.id));
  const deselect = (id: string) => {
    if (mode === "single") {
      onChange("");
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-secondary">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((m) => (
          <div key={m.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-secondary-container bg-surface-container">
            <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
            <button
              onClick={() => deselect(m.id)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setOpen(true)}
          type="button"
          className="w-20 h-20 rounded-xl border-2 border-dashed border-secondary-container text-secondary hover:bg-surface-container flex flex-col items-center justify-center text-xs"
        >
          <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
          <span>{mode === "single" ? "Select" : "Add"}</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-secondary-container">
              <h3 className="font-medium">Select Media</h3>
              <button onClick={() => setOpen(false)} type="button" className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-secondary-container flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                type="button"
                className="px-3 py-2 rounded-xl bg-primary-container text-white text-sm disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload New"}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFile} className="hidden" />
              <span className="text-xs text-secondary">PNG, JPG, WebP, GIF up to 5MB</span>
            </div>

            {error && <div className="px-4 py-2 text-xs text-red-600 bg-red-50">{error}</div>}

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="text-center text-sm text-secondary py-8">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-center text-sm text-secondary py-8">No images found. Upload one to get started.</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {items.map((m) => {
                    const selected = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggle(m.id)}
                        type="button"
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${selected ? "border-primary-container ring-2 ring-primary-container" : "border-secondary-container hover:border-primary"}`}
                      >
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                        {selected && (
                          <div className="absolute top-1 right-1 bg-primary-container text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            <span className="material-symbols-outlined text-sm">check</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-secondary-container flex justify-end">
              <button onClick={() => setOpen(false)} type="button" className="px-4 py-2 rounded-xl bg-primary-container text-white text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
