"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/adminService";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    adminService.listSettings().then((s) => {
      const map: Record<string, string> = {};
      s.forEach(({ key, value }) => map[key] = value);
      setSettings(map);
    });
  }, []);

  const save = async () => {
    await adminService.updateSettings(settings);
  };

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display-md text-2xl text-primary-container">Settings</h1>
        <button onClick={save} className="px-4 py-2 rounded-xl text-sm bg-primary-container text-white">Save Settings</button>
      </div>

      <div className="bg-white rounded-2xl border border-secondary-container p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-secondary">Site Name</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.siteName || ""} onChange={(e) => update("siteName", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Domain</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.domain || ""} onChange={(e) => update("domain", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Default OG Image URL</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.defaultOG || ""} onChange={(e) => update("defaultOG", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Google Verification</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.googleVerification || ""} onChange={(e) => update("googleVerification", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Bing Verification</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.bingVerification || ""} onChange={(e) => update("bingVerification", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">RSS Enabled</label>
          <select className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.rss || "true"} onChange={(e) => update("rss", e.target.value)}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Twitter/X</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.twitter || ""} onChange={(e) => update("twitter", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Instagram</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.instagram || ""} onChange={(e) => update("instagram", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-secondary">Facebook</label>
          <input className="w-full mt-1 border border-secondary-container rounded-xl px-3 py-2 text-sm" value={settings.facebook || ""} onChange={(e) => update("facebook", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
