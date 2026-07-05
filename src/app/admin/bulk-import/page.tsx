"use client";

import { useEffect, useState } from "react";
import { adminService, AdminBulkJob } from "@/lib/adminService";

export default function BulkImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [jobs, setJobs] = useState<AdminBulkJob[]>([]);
  const [publishNow, setPublishNow] = useState(false);

  useEffect(() => { adminService.listBulkJobs().then(setJobs); }, []);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Mock parse CSV
    setRows([
      { title: "Ghost Cute", slug: "ghost-cute", tags: "halloween,cute", error: "" },
      { title: "Frog", slug: "frog", tags: "animals", error: "" },
    ]);
    setErrors([]);
    setWarnings(["2 rows missing cover image"]);
    setStep(2);
  };

  const validate = () => {
    setErrors([]);
    setStep(3);
  };

  const runImport = async () => {
    if (!file) return;
    const job = await adminService.uploadBulkCSV(file);
    await adminService.runBulkJob(job.id, publishNow);
    setStep(4);
    adminService.listBulkJobs().then(setJobs);
  };

  const stepLabels = ["", "Upload CSV", "Validation", "Preview", "Import"];

  return (
    <div className="space-y-6">
      <h1 className="font-display-md text-2xl text-primary-container">Bulk Import</h1>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex items-center gap-2 text-sm ${step >= i ? "text-primary-container font-medium" : "text-secondary"}`}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center border text-xs">{i}</span>
            {stepLabels[i]}
            {i < 4 && <span className="text-secondary mx-2">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-secondary-container p-8 text-center">
          <p className="text-secondary mb-4">Upload a CSV with columns: title, slug, description, tags, difficulty, grid, beads</p>
          <input type="file" accept=".csv" onChange={onUpload} className="mx-auto" />
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6">
          <p className="mb-4 font-medium">Validation Results</p>
          {errors.length === 0 ? <p className="text-green-600 text-sm">✔ No errors</p> : <ul className="text-red-600 text-sm">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
          {warnings.length > 0 && <ul className="text-yellow-600 text-sm mt-2">{warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm border border-secondary-container">Back</button>
            <button onClick={validate} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white">Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6">
          <p className="font-medium mb-4">Preview</p>
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container text-secondary"><tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Tags</th></tr></thead>
            <tbody className="divide-y divide-secondary-container">
              {rows.map((r, i) => <tr key={i}><td className="px-3 py-2">{r.title}</td><td className="px-3 py-2">{r.slug}</td><td className="px-3 py-2">{r.tags}</td></tr>)}
            </tbody>
          </table>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="pub" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
            <label htmlFor="pub" className="text-sm">Publish Now</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-xl text-sm border border-secondary-container">Back</button>
            <button onClick={runImport} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white">Import</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6">
          <p className="text-green-600 font-medium">Import job started!</p>
          <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 rounded-xl text-sm bg-primary-container text-white">Import Another</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-secondary-container p-5">
        <h2 className="font-headline-md text-lg mb-4">Latest Bulk Jobs</h2>
        <div className="divide-y divide-secondary-container">
          {jobs.map((j) => (
            <div key={j.id} className="py-3 flex items-center justify-between text-sm">
              <div><p className="font-medium">{j.name}</p><p className="text-secondary text-xs">{j.status}</p></div>
              <div className="text-right"><p>{j.processed}/{j.total}</p><p className="text-xs text-secondary">{j.errors} errors · {j.warnings} warnings</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
