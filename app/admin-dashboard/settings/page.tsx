'use client';
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { motion } from "motion/react";
import { Save, Settings, ShieldAlert, UploadCloud } from "lucide-react";

export default function SettingsPage() {
  const [maxFileSize, setMaxFileSize] = useState("100");
  const [allowedTypes, setAllowedTypes] = useState("GLB, USDZ, FBX, OBJ");
  const [emailNotif, setEmailNotif] = useState(true);
  const [errorAlert, setErrorAlert] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);
  const [savingUpload, setSavingUpload] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveUpload = async () => {
    setSavingUpload(true);
    try {
      await apiFetch("/admin/config/upload", {
        method: "PUT",
        body: JSON.stringify({ maxFileSize: Number(maxFileSize), allowedTypes }),
      });
      setMessage("✅ Upload config saved!");
    } catch {
      setMessage("❌ Failed to save.");
    } finally {
      setSavingUpload(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      await apiFetch("/admin/config/notifications", {
        method: "PUT",
        body: JSON.stringify({ emailNotif, errorAlert, dailyReport }),
      });
      setMessage("✅ Notification config saved!");
    } catch {
      setMessage("❌ Failed to save.");
    } finally {
      setSavingNotif(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">Configure global server limits, allowed file types, and notification dispatches</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 rounded-xl bg-indigo-500/10 text-sm text-indigo-300 border border-indigo-500/20 font-semibold"
        >
          {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Config */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 space-y-6 backdrop-blur-sm shadow-lg flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04]">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base tracking-wide">Upload Configuration</h2>
                <p className="text-slate-500 text-xs mt-0.5">Control file ingestion limits and format filters</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Max File Size Limit (MB)</label>
                <input
                  type="number"
                  value={maxFileSize}
                  onChange={e => setMaxFileSize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Allowed Formats (Comma-separated)</label>
                <input
                  type="text"
                  value={allowedTypes}
                  onChange={e => setAllowedTypes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSaveUpload}
            disabled={savingUpload}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingUpload ? "Saving parameters..." : "Save Upload Parameters"}
          </motion.button>
        </motion.div>

        {/* Notification Config */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 space-y-6 backdrop-blur-sm shadow-lg flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04]">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base tracking-wide">Notifications & Alerts</h2>
                <p className="text-slate-500 text-xs mt-0.5">Toggle automated dispatch triggers</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { label: "Dispatch email notifications for new orders", value: emailNotif, setter: setEmailNotif },
                { label: "Raise high-priority alert on system errors", value: errorAlert, setter: setErrorAlert },
                { label: "Compile and send daily performance reports", value: dailyReport, setter: setDailyReport },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-1.5">
                  <span className="text-slate-300 text-sm font-medium leading-relaxed">
                    {label}
                  </span>
                  <div
                    onClick={() => setter(!value)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${
                      value ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.25)]" : "bg-[#080d1a] border border-white/[0.08]"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform duration-300 ${
                      value ? "translate-x-5.5" : "translate-x-0.5"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSaveNotif}
            disabled={savingNotif}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingNotif ? "Saving settings..." : "Save Notification Settings"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}