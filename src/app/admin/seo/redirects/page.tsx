"use client";

import { useEffect, useState } from "react";
import { adminService, AdminRedirect } from "@/lib/adminService";

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<AdminRedirect[]>([]);
  const [oldUrl, setOldUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [type, setType] = useState<301 | 302>(301);

  useEffect(() => { adminService.listRedirects().then((res) => setRedirects(res.data)); }, []);

  const add = async () => {
    await adminService.createRedirect({ oldUrl, newUrl, type });
    setOldUrl(""); setNewUrl("");
    adminService.listRedirects().then((res) => setRedirects(res.data));
  };

  const remove = async (id: string) => {
    await adminService.deleteRedirect(id);
    adminService.listRedirects().then((res) => setRedirects(res.data));
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display-md text-2xl text-primary">Redirects</h1>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" placeholder="Old URL" value={oldUrl} onChange={(e) => setOldUrl(e.target.value)} />
        <input className="border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" placeholder="New URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
        <select className="border border-outline-variant/20 rounded-xl px-3 py-2 text-sm" value={type} onChange={(e) => setType(Number(e.target.value) as 301 | 302)}>
          <option value={301}>301 Permanent</option>
          <option value={302}>302 Temporary</option>
        </select>
        <button onClick={add} className="md:col-span-2 px-4 py-2 rounded-xl text-sm bg-primary text-white">Add Redirect</button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-container text-on-surface-variant"><tr><th className="px-4 py-3">Old URL</th><th className="px-4 py-3">New URL</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-secondary-container">
            {redirects.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.oldUrl}</td>
                <td className="px-4 py-3">{r.newUrl}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(r.id)} className="text-error text-sm hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
