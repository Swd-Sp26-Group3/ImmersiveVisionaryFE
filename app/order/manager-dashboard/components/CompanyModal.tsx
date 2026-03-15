"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Company } from "./type";

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
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? "Edit Company" : "Add New Company"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-white">Company Name *</Label>
            <Input value={form.CompanyName} onChange={(e) => update("CompanyName", e.target.value)}
              placeholder="e.g., Chanel Vietnam"
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white">Type</Label>
              <Select value={form.CompanyType} onValueChange={(v) => update("CompanyType", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {["BRAND", "AGENCY", "STUDIO", "SELLER"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Status</Label>
              <Select value={form.Status} onValueChange={(v) => update("Status", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input type="email" value={form.Email} onChange={(e) => update("Email", e.target.value)}
                placeholder="contact@company.com"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Phone</Label>
              <Input value={form.Phone} onChange={(e) => update("Phone", e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Address</Label>
            <Input value={form.Address} onChange={(e) => update("Address", e.target.value)}
              placeholder="123 Main Street, HCMC"
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Website</Label>
            <Input value={form.Website} onChange={(e) => update("Website", e.target.value)}
              placeholder="https://company.com"
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? "Save Changes" : "Add Company"}
          </Button>
        </div>
      </div>
    </div>
  );
}