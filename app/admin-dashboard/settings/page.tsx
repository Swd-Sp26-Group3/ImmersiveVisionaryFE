'use client';
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [maxFileSize, setMaxFileSize] = useState("100");
  const [allowedTypes, setAllowedTypes] = useState("GLB, USDZ, FBX, OBJ");
  const [emailNotif, setEmailNotif] = useState(true);
  const [errorAlert, setErrorAlert] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveUpload = async () => {
    setSaving(true);
    try {
      await apiFetch("/admin/config/upload", {
        method: "PUT",
        body: JSON.stringify({ maxFileSize: Number(maxFileSize), allowedTypes }),
      });
      setMessage("✅ Upload config saved!");
    } catch {
      setMessage("❌ Failed to save.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleSaveNotif = async () => {
    setSaving(true);
    try {
      await apiFetch("/admin/config/notifications", {
        method: "PUT",
        body: JSON.stringify({ emailNotif, errorAlert, dailyReport }),
      });
      setMessage("✅ Notification config saved!");
    } catch {
      setMessage("❌ Failed to save.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">System Settings</h1>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-slate-800 text-sm text-white border border-blue-500/30">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Config */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-lg mb-1">Upload Configuration</h2>
            <p className="text-gray-400 text-sm">Configure file upload limits and restrictions</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Max File Size (MB)</label>
            <input
              type="number"
              value={maxFileSize}
              onChange={e => setMaxFileSize(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Allowed File Types</label>
            <input
              type="text"
              value={allowedTypes}
              onChange={e => setAllowedTypes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-white"
            />
          </div>

          <button
            onClick={handleSaveUpload}
            disabled={saving}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Notification Config */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-lg mb-1">Notification Settings</h2>
            <p className="text-gray-400 text-sm">Configure system notifications and alerts</p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Email notifications for new orders", value: emailNotif, setter: setEmailNotif },
              { label: "Alert on system errors", value: errorAlert, setter: setErrorAlert },
              { label: "Daily performance reports", value: dailyReport, setter: setDailyReport },
            ].map(({ label, value, setter }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setter(!value)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    value ? "bg-blue-600" : "bg-slate-600"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    value ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </div>
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveNotif}
            disabled={saving}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}