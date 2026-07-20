"use client";

import { useState, useRef } from "react";
import { adminService } from "@/lib/adminService";
import type { SeedImportResult } from "@/types";

export default function SeedImportPage() {
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SeedImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadError, setLoadError] = useState<string>("");
  const [runStatus, setRunStatus] = useState<"idle" | "success" | "error">("idle");
  const [runMessage, setRunMessage] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = async (f: File) => {
    setFile(f);
    const text = await f.text();
    setJsonText(text);
  };

  const loadPublicSamples = async () => {
    setLoading(true);
    setLoadStatus("loading");
    setLoadError("");
    try {
      const res = await fetch("/data/seed-samples-phase1.json");
      if (!res.ok) throw new Error(`Failed to load samples: ${res.status}`);
      const text = await res.text();
      setJsonText(text);
      setLoadStatus("success");
    } catch (err) {
      setLoadStatus("error");
      setLoadError((err as Error).message);
      setPreview({
        dryRun: true,
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [(err as Error).message],
      } as SeedImportResult);
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    setLoading(true);
    setPreview(null);
    setRunStatus("idle");
    setRunMessage("");
    try {
      const source = jsonText.trim();
      if (!source) throw new Error("No JSON content to import");
      const parsed = JSON.parse(source);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) throw new Error("No patterns found in JSON");
      const result = await adminService.seedImport(arr, dryRun);
      const created = result.results?.filter((r) => r.status === "created").length ?? 0;
      const updated = result.results?.filter((r) => r.status === "updated").length ?? 0;
      const failed = result.results?.filter((r) => r.errors?.length).length ?? 0;
      const normalized = {
        ...result,
        dryRun: result.dryRun ?? dryRun,
        created: result.created ?? created,
        updated: result.updated ?? updated,
        failed: result.failed ?? failed,
      };
      setPreview(normalized);
      setRunStatus("success");
      setRunMessage(`${dryRun ? "Preview" : "Import"} complete: ${created} created, ${updated} updated, ${failed} failed`);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch (err) {
      const errorPreview = {
        dryRun,
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [(err as Error).message],
      } as SeedImportResult;
      setPreview(errorPreview);
      setRunStatus("error");
      setRunMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">Seed Import</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPublicSamples}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm border border-outline-variant/20 hover:bg-surface-container-low-container disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load 20 Sample Patterns"}
          </button>
          {loadStatus === "success" && (
            <span className="text-xs text-secondary">Loaded 20 samples</span>
          )}
          {loadStatus === "error" && (
            <span className="text-xs text-error">{loadError}</span>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry Run
          </label>
        </div>
        <textarea
          className="w-full border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-mono"
          rows={12}
          value={jsonText}
          placeholder={`[\n  {\n    "title": "Pumpkin Cat",\n    "slug": "pumpkin-cat",\n    "difficulty": "easy",\n    "grid_size": "32x32"\n  }\n]`}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button onClick={runImport} disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-primary text-white hover:bg-primary disabled:opacity-50">
            {loading ? "Processing..." : dryRun ? "Preview" : "Import"}
          </button>
          {runStatus === "success" && (
            <span className="text-xs text-secondary">{runMessage}</span>
          )}
          {runStatus === "error" && (
            <span className="text-xs text-error">{runMessage}</span>
          )}
        </div>
      </div>

      {preview && (
        <div ref={resultRef} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 space-y-4">
          <h2 className="font-headline-md text-lg">Result</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-container rounded-xl">
              <div className="text-xs text-on-surface-variant">Total</div>
              <div className="text-xl font-bold">{preview.total}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="text-xs text-green-700">Created</div>
              <div className="text-xl font-bold text-green-700">{preview.created}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-xs text-blue-700">Updated</div>
              <div className="text-xl font-bold text-blue-700">{preview.updated}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="text-xs text-red-700">Failed</div>
              <div className="text-xl font-bold text-red-700">{preview.failed}</div>
            </div>
          </div>
          {preview.results && preview.results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container text-on-surface-variant uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Slug</th>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-container">
                  {preview.results.map((row) => (
                    <tr key={row.index}>
                      <td className="px-4 py-2">{row.index}</td>
                      <td className="px-4 py-2">{row.slug}</td>
                      <td className="px-4 py-2">{row.title}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${row.status === "created" ? "bg-secondary-container text-green-800" : "bg-primary-fixed text-blue-800"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-error">{row.errors?.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.errors && preview.errors.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-error">Errors</h3>
              {(preview.errors || []).map((err: string, i: number) => (
                <div key={i} className="text-sm text-error bg-red-50 p-2 rounded-lg">{err}</div>
              ))}
            </div>
          )}
          {preview.createdSlugs && (preview.createdSlugs || []).length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-1">Created Slugs</h3>
              <div className="text-sm text-on-surface-variant">{preview.createdSlugs.join(", ")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
