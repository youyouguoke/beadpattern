"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/lib/adminService";
import MediaPicker from "@/components/admin/MediaPicker";
import { AuditStatusBadge } from "@/components/admin/AuditStatusBadge";
import { JsonEditor } from "@/components/admin/JsonEditor";
import type { Pattern, PatternStep, PatternDetail } from "@/types";

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const GRID_STATUSES = [
  { value: "missing", label: "Missing" },
  { value: "designing", label: "Designing" },
  { value: "review", label: "Review" },
  { value: "ready", label: "Ready" },
];

export default function PatternEditorPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [pattern, setPattern] = useState<Partial<Pattern>>({});
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (id === "new") {
      setPattern({
        title: "",
        slug: "",
        description: "",
        difficulty: "easy",
        gridSize: "32x32",
        estimatedBeads: 0,
        colorCount: 0,
        status: "draft",
        tags: [],
        categories: [],
        collections: [],
        steps: [],
        colorPalette: [],
        gridData: [],
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        keywords: [],
        subject: "",
        style: "",
        season: "",
        estimatedTime: "",
        seoPriority: 50,
        publishOrder: 0,
        gridStatus: "missing",
        gridDesigner: "",
        gridVersion: 1,
        gridReviewRequired: false,
        healthChecks: [],
      });
    } else {
      adminService.getPattern(id).then((p: PatternDetail) => setPattern({ ...p, related: p.related as unknown as Pattern["related"] }));
    }
  }, [id]);

  const save = async (status?: Pattern["status"]) => {
    const data = { ...pattern, status: status || pattern.status };
    if (id === "new") {
      await adminService.createPattern(data);
    } else {
      await adminService.updatePattern(id, data);
    }
    router.push("/admin/patterns");
  };

  const updateStep = (index: number, field: keyof PatternStep, value: string) => {
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
        <div className="flex items-center gap-3">
          <AuditStatusBadge score={pattern.healthScore ?? 0} audit={pattern.audit} showDetails />
          <div className="flex gap-2">
            <button onClick={() => save("draft")} className="px-4 py-2 rounded-xl text-sm border border-secondary-container hover:bg-surface-container">Save Draft</button>
            <button onClick={() => save("published")} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white hover:bg-primary">Publish</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-secondary-container">
        {["basic", "metadata", "steps", "media", "seo"].map((tab) => (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Subject</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="e.g. Animal, Flower, Character" value={pattern.subject || ""} onChange={(e) => setPattern({ ...pattern, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Style</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="e.g. Pixel, Realistic, Cartoon" value={pattern.style || ""} onChange={(e) => setPattern({ ...pattern, style: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Season</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="e.g. Spring, Halloween" value={pattern.season || ""} onChange={(e) => setPattern({ ...pattern, season: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Difficulty</label>
              <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.difficulty || "easy"} onChange={(e) => setPattern({ ...pattern, difficulty: e.target.value as Pattern["difficulty"] })}>
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Grid Size</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.gridSize || ""} onChange={(e) => setPattern({ ...pattern, gridSize: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Estimated Beads</label>
              <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.estimatedBeads || 0} onChange={(e) => setPattern({ ...pattern, estimatedBeads: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Color Count</label>
              <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.colorCount || 0} onChange={(e) => setPattern({ ...pattern, colorCount: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Estimated Time</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" placeholder="e.g. 2-3 hours" value={pattern.estimatedTime || ""} onChange={(e) => setPattern({ ...pattern, estimatedTime: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">SEO Priority</label>
              <input type="number" min={0} max={100} className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.seoPriority ?? 50} onChange={(e) => setPattern({ ...pattern, seoPriority: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Publish Order</label>
              <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.publishOrder ?? 0} onChange={(e) => setPattern({ ...pattern, publishOrder: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Status</label>
              <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.status || "draft"} onChange={(e) => setPattern({ ...pattern, status: e.target.value as Pattern["status"] })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary">Grid Status</label>
              <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.gridStatus || "missing"} onChange={(e) => setPattern({ ...pattern, gridStatus: e.target.value as Pattern["gridStatus"] })}>
                {GRID_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Grid Designer</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.gridDesigner || ""} onChange={(e) => setPattern({ ...pattern, gridDesigner: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Grid Version</label>
              <input type="number" className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.gridVersion || 1} onChange={(e) => setPattern({ ...pattern, gridVersion: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="gridReview" type="checkbox" checked={pattern.gridReviewRequired || false} onChange={(e) => setPattern({ ...pattern, gridReviewRequired: e.target.checked })} />
            <label htmlFor="gridReview" className="text-sm text-secondary">Grid Review Required</label>
          </div>
        </div>
      )}

      {activeTab === "metadata" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4">
            <h3 className="font-headline-md text-lg mb-2">Color Palette</h3>
            <JsonEditor
              value={pattern.colorPalette || []}
              onChange={(v) => setPattern({ ...pattern, colorPalette: v })}
              placeholder={`[{ "hex": "#FF5733", "name": "Orange", "count": 120 }]}`}
            />
          </div>
          <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-4">
            <h3 className="font-headline-md text-lg mb-2">Grid Data</h3>
            <JsonEditor
              value={pattern.gridData || []}
              onChange={(v) => setPattern({ ...pattern, gridData: v })}
              placeholder={`[[1, 2, 1], [2, 1, 2]]}`}
            />
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
                  <button onClick={() => moveStep(index, -1)} disabled={index === 0} className="text-secondary disabled:opacity-30">↑</button>
                  <button onClick={() => moveStep(index, 1)} disabled={index === (pattern.steps?.length || 0) - 1} className="text-secondary disabled:opacity-30">↓</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-secondary">Description</label>
                  <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" rows={3} value={step.description} onChange={(e) => updateStep(index, "description", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-secondary">Grid Data (JSON)</label>
                  <textarea className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm font-mono" rows={3} value={typeof step.gridData === "string" ? step.gridData : String(JSON.stringify(step.gridData || ""))} onChange={(e) => updateStep(index, "gridData", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addStep} className="w-full py-3 rounded-xl border-2 border-dashed border-secondary-container text-secondary hover:bg-surface-container">+ Add Step</button>
        </div>
      )}

      {activeTab === "media" && (
        <div className="bg-white rounded-2xl border border-secondary-container p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaPicker
              label="Cover Image"
              mode="single"
              type="cover"
              value={pattern.coverMediaId}
              onChange={(id: string | string[]) => setPattern({ ...pattern, coverMediaId: id as string })}
            />
            <MediaPicker
              label="Finished Image"
              mode="single"
              type="finished"
              value={pattern.finishedMediaId}
              onChange={(id: string | string[]) => setPattern({ ...pattern, finishedMediaId: id as string })}
            />
          </div>
          <MediaPicker
            label="Gallery Images"
            mode="multiple"
            type="gallery"
            value={pattern.galleryMediaIds}
            onChange={(ids: string | string[]) => setPattern({ ...pattern, galleryMediaIds: ids as string[] })}
          />
          <MediaPicker
            label="Step Images"
            mode="multiple"
            type="step"
            value={pattern.stepMediaIds}
            onChange={(ids: string | string[]) => setPattern({ ...pattern, stepMediaIds: ids as string[] })}
          />
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
              <label className="text-sm font-medium text-secondary">SEO Keywords (comma separated)</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.seoKeywords || ""} onChange={(e) => setPattern({ ...pattern, seoKeywords: e.target.value, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary">Canonical URL</label>
              <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={pattern.canonical || ""} onChange={(e) => setPattern({ ...pattern, canonical: e.target.value })} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-secondary-container p-6">
            <h3 className="font-headline-md text-lg mb-4">Content Health</h3>
            <div className="space-y-2">
              {(pattern.healthChecks || []).map((check) => (
                <div key={check.label} className="flex items-center gap-3">
                  <span className={`${check.pass ? "text-green-600" : "text-red-500"}`}>{check.pass ? "✓" : "✕"}</span>
                  <span className="text-sm">{check.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-surface-container">
              <p className="text-sm text-secondary">SEO Score</p>
              <p className="text-3xl font-bold mt-1">{pattern.healthScore ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
