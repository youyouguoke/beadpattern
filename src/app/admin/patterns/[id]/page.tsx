"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService, AdminPattern, AdminStep } from "@/lib/adminService";

export default function PatternEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [pattern, setPattern] = useState<Partial<AdminPattern>>({});
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (id === "new") {
      setPattern({
        title: "",
        slug: "",
        description: "",
        difficulty: "Easy",
        grid: "32x32",
        beadCount: 0,
        colors: 0,
        status: "draft",
        tags: [],
        categories: [],
        collections: [],
        steps: [],
        seoTitle: "",
        seoDescription: "",
        keywords: [],
        healthChecks: [],
      });
    } else {
      adminService.getPattern(id).then(setPattern);
    }
  }, [id]);

  const save = async (status?: AdminPattern["status"]) => {
    const data = { ...pattern, status: status || pattern.status };
    if (id === "new") {
      await adminService.createPattern(data);
    } else {
      await adminService.updatePattern(id, data);
    }
    router.push("/admin/patterns");
  };

  const updateStep = (index: number, field: keyof AdminStep, value: string) => {
    const steps = [...(pattern.steps || [])];
    steps[index] = { ...steps[index], [field]: value };
    setPattern({ ...pattern, steps });
  };

  const addStep = () => {
    setPattern({
      ...pattern,
      steps: [...(pattern.steps || []), { id: `s${Date.now()}`, stepNumber: (pattern.steps?.length || 0) + 1, description: "" }],
    });
  };

  const moveStep = (index: number, direction: number) => {
    const steps = [...(pattern.steps || [])];
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]];
    steps.forEach((s, i) => (s.stepNumber = i + 1));
    setPattern({ ...pattern, steps });
  };

  if (!pattern.title && id !== "new") return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">{id === "new" ? "Create Pattern" : "Edit Pattern"}</h1>
        <div className="flex gap-2">
          <button onClick={() => save("draft")} className="px-4 py-2 rounded-xl text-sm border border-secondary-container hover:bg-surface-container">Save Draft</button>
          <button onClick={() => save("published")} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white hover:bg-primary">Publish</button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-secondary-container">
        {["basic", "steps", "media", "seo"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? "text-primary-container border-b-2 border-primary-container" : "text-secondary"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Title</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.title || ""} onChange={(e) => setPattern({ ...pattern, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Slug</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.slug || ""} onChange={(e) => setPattern({ ...pattern, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-secondary">Description</label>
            <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" rows={4} value={pattern.description || ""} onChange={(e) => setPattern({ ...pattern, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Difficulty</label>
              <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.difficulty || "Easy"} onChange={(e) => setPattern({ ...pattern, difficulty: e.target.value as any })}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Grid Size</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.grid || ""} onChange={(e) => setPattern({ ...pattern, grid: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Estimated Beads</label>
              <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.beadCount || 0} onChange={(e) => setPattern({ ...pattern, beadCount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Status</label>
              <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.status || "draft"} onChange={(e) => setPattern({ ...pattern, status: e.target.value as any })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "steps" && (
        <div className="space-y-4">
          {(pattern.steps || []).map((step, index) => (
            <div key={step.id} className="bg-white rounded-2xl border border-secondary-container p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Step {step.stepNumber}</span>
                <div className="flex gap-2">
                  <button onClick={() => moveStep(index, -1)} disabled={index === 0} className="text-secondary disabled:opacity-30"><span className="material-symbols-outlined">arrow_upward</span></button>
                  <button onClick={() => moveStep(index, 1)} disabled={index === (pattern.steps?.length || 0) - 1} className="text-secondary disabled:opacity-30"><span className="material-symbols-outlined">arrow_downward</span></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary">Description</label>
                  <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" rows={3} value={step.description} onChange={(e) => updateStep(index, "description", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-secondary">Grid Data (JSON)</label>
                  <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm font-mono" rows={3} value={step.gridData || ""} onChange={(e) => updateStep(index, "gridData", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addStep} className="w-full py-3 rounded-xl border-2 border-dashed border-secondary-container text-secondary hover:bg-surface-container">+ Add Step</button>
        </div>
      )}

      {activeTab === "media" && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-secondary">Cover Image URL</label>
            <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.coverImage || ""} onChange={(e) => setPattern({ ...pattern, coverImage: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-secondary">Finished Image URL</label>
            <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.finishedImage || ""} onChange={(e) => setPattern({ ...pattern, finishedImage: e.target.value })} />
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary">SEO Title</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.seoTitle || ""} onChange={(e) => setPattern({ ...pattern, seoTitle: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">SEO Description</label>
              <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" rows={3} value={pattern.seoDescription || ""} onChange={(e) => setPattern({ ...pattern, seoDescription: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Canonical URL</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.canonical || ""} onChange={(e) => setPattern({ ...pattern, canonical: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Keywords (comma separated)</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={(pattern.keywords || []).join(", ")} onChange={(e) => setPattern({ ...pattern, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-secondary-container p-6">
            <h3 className="font-headline-md text-lg mb-4">Content Health</h3>
            <div className="space-y-2">
              {(pattern.healthChecks || []).map((check) => (
                <div key={check.label} className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${check.pass ? "text-green-600" : "text-red-500"}`}>{check.pass ? "check_circle" : "cancel"}</span>
                  <span className="text-sm">{check.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-surface-container">
              <p className="text-sm text-secondary">SEO Score</p>
              <p className="text-3xl font-bold mt-1">{pattern.healthScore || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
