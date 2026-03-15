"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Company, Product } from "./type";


interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [form, setForm] = useState({
    ProductName: product?.ProductName ?? "",
    Description: product?.Description ?? "",
    Category:    product?.Category    ?? "",
    SizeInfo:    product?.SizeInfo    ?? "",
    ColorInfo:   product?.ColorInfo   ?? "",
    CompanyId:   product?.CompanyId   ? String(product.CompanyId) : "",
  });

  useEffect(() => {
    apiFetch("/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.data ?? data))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, []);

  const update = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.ProductName.trim()) { setError("Product name is required."); return; }
    if (!isEdit && !form.CompanyId) { setError("Please select a company."); return; }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        const res = await apiFetch(`/products/${product!.ProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProductName: form.ProductName,
            Description: form.Description || null,
            Category:    form.Category    || null,
            SizeInfo:    form.SizeInfo    || null,
            ColorInfo:   form.ColorInfo   || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        const res = await apiFetch("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CompanyId:   Number(form.CompanyId),
            ProductName: form.ProductName,
            Description: form.Description || null,
            Category:    form.Category    || null,
            SizeInfo:    form.SizeInfo    || null,
            ColorInfo:   form.ColorInfo   || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const activeCompanies = companies.filter((c) => c.Status === "ACTIVE" || c.Status === null);
  const currentCompany  = companies.find((c) => c.CompanyId === product?.CompanyId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Company — select on create, read-only on edit */}
          {!isEdit ? (
            <div className="space-y-2">
              <Label className="text-white">Company *</Label>
              {companiesLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading companies...
                </div>
              ) : activeCompanies.length === 0 ? (
                <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  No active companies. Please create one first.
                </div>
              ) : (
                <Select value={form.CompanyId} onValueChange={(v) => update("CompanyId", v)}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {activeCompanies.map((c) => (
                      <SelectItem key={c.CompanyId} value={String(c.CompanyId)}>
                        {c.CompanyName}
                        {c.CompanyType && <span className="text-slate-400 ml-1">({c.CompanyType})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-white">Company</Label>
              <div className="bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2 text-slate-400 text-sm">
                {currentCompany ? `${currentCompany.CompanyName}` : `Company ID: ${product?.CompanyId}`}
                <span className="ml-1 text-slate-600 text-xs">(cannot change)</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Product Name *</Label>
            <Input value={form.ProductName} onChange={(e) => update("ProductName", e.target.value)}
              placeholder="e.g., Luxury Perfume AR"
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Category</Label>
            <Select value={form.Category} onValueChange={(v) => update("Category", v)}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {["Cosmetics", "Fashion", "Food & Beverage", "Electronics", "Home Decor", "Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea value={form.Description} onChange={(e) => update("Description", e.target.value)}
              placeholder="Product description..." rows={3}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white">Size Info</Label>
              <Input value={form.SizeInfo} onChange={(e) => update("SizeInfo", e.target.value)}
                placeholder="e.g., 30x30x30cm"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Color Info</Label>
              <Input value={form.ColorInfo} onChange={(e) => update("ColorInfo", e.target.value)}
                placeholder="e.g., Gold, Black"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
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
          <Button
            onClick={handleSave}
            disabled={saving || (!isEdit && companiesLoading)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}