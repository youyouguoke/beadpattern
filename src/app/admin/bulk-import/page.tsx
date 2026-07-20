"use client";

import { useEffect, useState } from "react";
import { adminService, AdminBulkJob } from "@/lib/adminService";

export default function BulkImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jobs, setJobs] = useState<AdminBulkJob[]>([]);
  const [publishNow, setPublishNow] = useState(false);
  const [imported, setImported] = useState<{ jobId: string; total: number; processed: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => { adminService.listBulkJobs().then((res) => setJobs(res.data)); }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const text = await f.text();
    setSourceData(text);
    const preview = await adminService.previewBulkImport("csv", text);
    setRows(preview.rows.map((r: any) => r.data));
    setErrors(preview.rows.filter((r: any) => r.errors?.length).map((r: any) => `Row ${r.row}: ${r.errors.join(", ")}`));
    setWarnings(["2 rows missing cover image"]);
    setStep(2);
  };

  const validate = () => {
    if (errors.length === 0) setStep(3);
  };

  const runImport = async () => {
    if (!file || !sourceData) return;
    const result = await adminService.createBulkImport("csv", sourceData);
    setImported(result);
    if (publishNow && result.processed > 0) {
      await adminService.publishBulkImport();
    }
    setStep(4);
    adminService.listBulkJobs().then((res) => setJobs(res.data));
  };

  const stepLabels = ["", "Upload CSV", "Validation", "Preview", "Import"];

  return (
    <div className="space-y-6">
      <h1 className="font-display-md text-2xl text-primary">Bulk Import</h1>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex items-center gap-2 text-sm ${step >= i ? "text-primary font-medium" : "text-on-surface-variant"}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center border text-xs">{i}</span>
            {stepLabels[i]}
            {i < 4 && <span className="text-on-surface-variant mx-2">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-8 text-center">
          <p className="text-on-surface-variant mb-4">Upload a CSV with columns: title, slug, description, tags, difficulty, grid, beads</p>
          <input type="file" accept=".csv" onChange={onUpload} className="mx-auto" />
        </div>
      )}

      {step === 2 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6">
          <p className="mb-4 font-medium">Validation Results</p>
          {errors.length === 0 ? <p className="text-secondary text-sm">✔ No errors</p> : <ul className="text-error text-sm">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
          {warnings.length > 0 && <ul className="text-tertiary text-sm mt-2">{warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm border border-outline-variant/20">Back</button>
            <button onClick={validate} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6">
          <p className="font-medium mb-4">Preview</p>
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container text-on-surface-variant"><tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Tags</th></tr></thead>
            <tbody className="divide-y divide-secondary-container">
              {rows.map((r, i) => <tr key={i}><td className="px-3 py-2">{r.title}</td><td className="px-3 py-2">{r.slug}</td><td className="px-3 py-2">{r.tags}</td></tr>)}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="pub" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            <label htmlFor="pub" className="text-sm">Publish Now</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-xl text-sm border border-outline-variant/20">Back</button>
            <button onClick={runImport} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Import</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6">
          <p className="text-secondary font-medium">Import job started!</p>
          <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 rounded-xl text-sm bg-primary text-white">Import Another</button>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5">
        <h2 className="font-headline-md text-lg mb-4">Latest Bulk Jobs</h2>
        <div className="divide-y divide-secondary-container">
          {jobs.map((j) => (
            <div key={j.id} className="py-3 flex items-center justify-between text-sm">
              <div><p className="font-medium">{j.name}</p><p className="text-on-surface-variant text-xs">{j.status}</p></div>
              <div className="text-right"><p>{j.processed}/{j.total}</p><p className="text-xs text-on-surface-variant">{j.errors} errors · {j.warnings} warnings</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
