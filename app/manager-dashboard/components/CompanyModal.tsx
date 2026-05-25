"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Company } from "./type";
import { motion } from "motion/react";

interface CompanyModalProps {
  company: Company | null;
  onClose: () => void;
  onSave: () => void;
}

export function CompanyModal({ company, onClose, onSave }: CompanyModalProps) {
  const isEdit = !!company;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    CompanyName: company?.CompanyName ?? "",
    Address:     company?.Address     ?? "",
    Email:       company?.Email       ?? "",
    Phone:       company?.Phone       ?? "",
    Website:     company?.Website     ?? "",
    CompanyType: company?.CompanyType ?? "",
    Status:      company?.Status      ?? "ACTIVE",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.CompanyName.trim()) { setError("Company name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        CompanyName: form.CompanyName,
        Address:     form.Address     || null,
        Email:       form.Email       || null,
        Phone:       form.Phone       || null,
        Website:     form.Website     || null,
        CompanyType: form.CompanyType || null,
        Status:      form.Status      || null,
      };

      const endpoint = isEdit ? `/companies/${company!.CompanyId}` : "/companies";
      const method   = isEdit ? "PUT" : "POST";
      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      onSave();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-white/[0.01]">
          <h2 className="text-white font-bold text-base tracking-tight">
            {isEdit ? "Modify Brand Credentials" : "Register Brand Profile"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Company Name *</Label>
            <Input 
              value={form.CompanyName} 
              onChange={(e) => update("CompanyName", e.target.value)}
              placeholder="e.g., Luxury Retail Inc"
              className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Corporate Sector</Label>
              <Select value={form.CompanyType} onValueChange={(v) => update("CompanyType", v)}>
                <SelectTrigger className="bg-[#080d1a] border-white/[0.06] text-white rounded-xl h-10 focus:outline-none">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1324] border-white/[0.08] text-white rounded-xl">
                  {["BRAND", "AGENCY", "STUDIO", "SELLER"].map((t) => (
                    <SelectItem key={t} value={t} className="focus:bg-purple-600 focus:text-white rounded-lg cursor-pointer m-1">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Clearance Status</Label>
              <Select value={form.Status} onValueChange={(v) => update("Status", v)}>
                <SelectTrigger className="bg-[#080d1a] border-white/[0.06] text-white rounded-xl h-10 focus:outline-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1324] border-white/[0.08] text-white rounded-xl">
                  {["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => (
                    <SelectItem key={s} value={s} className="focus:bg-purple-600 focus:text-white rounded-lg cursor-pointer m-1">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Contact Email</Label>
              <Input 
                type="email" 
                value={form.Email} 
                onChange={(e) => update("Email", e.target.value)}
                placeholder="contact@brand.com"
                className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Corporate Line</Label>
              <Input 
                value={form.Phone} 
                onChange={(e) => update("Phone", e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Headquarters Location</Label>
            <Input 
              value={form.Address} 
              onChange={(e) => update("Address", e.target.value)}
              placeholder="e.g. 72 Le Thanh Ton, District 1, HCMC"
              className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Corporate Domain</Label>
            <Input 
              value={form.Website} 
              onChange={(e) => update("Website", e.target.value)}
              placeholder="https://brand.com"
              className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl h-10 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 rounded-xl px-3.5 py-2.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 p-5 border-t border-white/[0.06] bg-white/[0.01]">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/[0.08] hover:bg-white/[0.02] text-slate-300 rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {isEdit ? "Update Credentials" : "Create Profile"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}