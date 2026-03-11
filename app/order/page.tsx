"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { motion } from "motion/react";
import {
  ShoppingCart, Package, Camera, Clock, FileText,
  Upload, CheckCircle2, Loader2, AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function OrderProductPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [orderType, setOrderType] = useState<"ready-made" | "custom">("ready-made");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    projectName: "",
    productType: "",
    description: "",
    deadline: "",
    budget: "",
    arOptimize: false,
    animation: false,
    multiVariant: false,
    sourceFiles: false,
  });

  const updateForm = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  // Submit custom order → POST /api/products (endpoint có sẵn)
  const handleSubmitCustom = async () => {
    if (!form.projectName.trim()) {
      setSubmitError("Vui lòng nhập tên dự án.");
      return;
    }
    if (!form.description.trim()) {
      setSubmitError("Vui lòng mô tả sản phẩm.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      // Dùng POST /api/products — endpoint đã có trong BE
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          CompanyId: 1,                          // TODO: lấy từ user.companyId khi có
          ProductName: form.projectName,
          Description: form.description,
          Category: form.productType || null,
          SizeInfo: form.deadline || null,       // tạm dùng SizeInfo lưu deadline
          ColorInfo: form.budget || null,        // tạm dùng ColorInfo lưu budget
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Gửi yêu cầu thất bại.");
      }

      const data = await res.json();
      // Lưu order mới vào session để order-success đọc
      sessionStorage.setItem(
        "customOrder",
        JSON.stringify(data.data ?? data)
      );

      // Redirect về dashboard sau khi gửi thành công
      router.push(
        `/order-success?productId=${(data.data ?? data).ProductId}&name=${encodeURIComponent(form.projectName)}`
      );
    } catch (err: any) {
      setSubmitError(err.message ?? "Đã có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save draft — lưu vào localStorage, không redirect
  const handleSaveDraft = () => {
    localStorage.setItem("orderDraft", JSON.stringify(form));
    alert("Đã lưu bản nháp!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Order 3D/AR Products</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose from ready-made products or order custom 3D/AR production
          </p>
        </motion.div>

        {/* Order Type Toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-white">Order Type</CardTitle>
              <CardDescription className="text-gray-400">Select the type of product you want to order</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as "ready-made" | "custom")}
                className="grid md:grid-cols-2 gap-4"
              >
                {/* Ready-made */}
                <Label
                  htmlFor="ready-made"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    orderType === "ready-made" ? "border-indigo-500 bg-indigo-500/10" : "border-purple-500/20 hover:border-purple-500/40"
                  }`}
                >
                  <RadioGroupItem value="ready-made" id="ready-made" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white">Ready-Made Products</span>
                    </div>
                    <p className="text-sm text-gray-400">Instant download from catalog</p>
                  </div>
                </Label>

                {/* Custom */}
                <Label
                  htmlFor="custom"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    orderType === "custom" ? "border-indigo-500 bg-indigo-500/10" : "border-purple-500/20 hover:border-purple-500/40"
                  }`}
                >
                  <RadioGroupItem value="custom" id="custom" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Custom Production</span>
                    </div>
                    <p className="text-sm text-gray-400">Custom 3D/AR on demand</p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* ========================= READY-MADE ========================= */}
        {orderType === "ready-made" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Browse Catalog</CardTitle>
                <CardDescription className="text-gray-400">Find ready-made 3D/AR products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-400 text-sm">
                  Head to the Marketplace to browse all available products and purchase directly.
                </p>
                <Link href="/marketplace">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Go to Marketplace
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ========================= CUSTOM PRODUCTION ========================= */}
        {orderType === "custom" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">

            {/* Project Information */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Project Information</CardTitle>
                <CardDescription className="text-gray-400">Details about the 3D product you want</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-white">Project Name *</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g., XYZ Phone 3D Model"
                      value={form.projectName}
                      onChange={(e) => updateForm("projectName", e.target.value)}
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Product Type */}
                  <div className="space-y-2">
                    <Label htmlFor="product-type" className="text-white">Product Type *</Label>
                    <Select onValueChange={(v) => updateForm("productType", v)}>
                      <SelectTrigger id="product-type" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Cosmetics">Cosmetics</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product: dimensions, colors, materials, special requirements..."
                    rows={5}
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-white">Desired Deadline</Label>
                    <Select onValueChange={(v) => updateForm("deadline", v)}>
                      <SelectTrigger id="deadline" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select deadline" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="standard">Standard (7–10 days)</SelectItem>
                        <SelectItem value="express">Express (3–5 days)</SelectItem>
                        <SelectItem value="rush">Rush (1–2 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-white">Estimated Budget</Label>
                    <Select onValueChange={(v) => updateForm("budget", v)}>
                      <SelectTrigger id="budget" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30">
                        <SelectItem value="$5-$10">$5 – $10</SelectItem>
                        <SelectItem value="$10-$30">$10 – $30</SelectItem>
                        <SelectItem value="$30-$50">$30 – $50</SelectItem>
                        <SelectItem value="$50+">$50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Upload Reference Materials</CardTitle>
                <CardDescription className="text-gray-400">Product images, drawings, or documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept="image/*,.pdf,.doc,.docx" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Drag & drop or click to select files</p>
                    <p className="text-sm text-gray-400">JPG, PNG, PDF, DOC (Max 10MB per file)</p>
                  </Label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#0f1729] rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-400" />
                          <span className="text-sm text-white">{file.name}</span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Additional Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "arOptimize", label: "AR optimization for web & mobile (+$2)" },
                  { key: "animation", label: "Add 3D animations (+$300)" },
                  { key: "multiVariant", label: "Multiple color/material variants (+$15)" },
                  { key: "sourceFiles", label: "Include editable source files (+$10)" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={form[key as keyof typeof form] as boolean}
                      onCheckedChange={(v) => updateForm(key as keyof typeof form, !!v)}
                      className="border-purple-500/30"
                    />
                    <Label htmlFor={key} className="text-sm text-gray-300 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500/30 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Clock className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">What happens next?</h3>
                    <ul className="text-sm text-gray-300 space-y-1 ml-2">
                      <li>• Our team will contact you within 24 hours</li>
                      <li>• Confirm requirements and provide accurate quote</li>
                      <li>• Schedule photoshoot if needed</li>
                      <li>• Begin 3D/AR production</li>
                    </ul>
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={handleSaveDraft}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-white hover:bg-white/5"
                    disabled={submitting}
                  >
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleSubmitCustom}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}