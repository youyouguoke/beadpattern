"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/adminService";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    adminService.listSettings().then((s) => {
      setSettings(typeof s === "object" && s !== null ? (s as Record<string, string>) : {});
    });
  }, []);

  const save = async () => {
    await adminService.updateSettings(settings);
  };

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary">Settings</h1>
        <button onClick={save} className="px-4 py-2 rounded-xl text-sm bg-primary text-white">Save Settings</button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Site Name</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.siteName || ""} onChange={(e) => update("siteName", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Domain</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.domain || ""} onChange={(e) => update("domain", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Default OG Image URL</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.defaultOG || ""} onChange={(e) => update("defaultOG", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Google Verification</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.googleVerification || ""} onChange={(e) => update("googleVerification", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Bing Verification</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.bingVerification || ""} onChange={(e) => update("bingVerification", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">RSS Enabled</label>
          <select className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.rss || "true"} onChange={(e) => update("rss", e.target.value)}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Twitter/X</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.twitter || ""} onChange={(e) => update("twitter", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Instagram</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.instagram || ""} onChange={(e) => update("instagram", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface-variant">Facebook</label>
          <input className="w-full mt-1 border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={settings.facebook || ""} onChange={(e) => update("facebook", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
