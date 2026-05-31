"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
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
  const { addItem, openCart } = useCart();

  const [orderType, setOrderType] = useState<"ready-made" | "custom">("ready-made");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users/profile")
      .then(res => res.json())
      .catch(err => console.error("Failed to fetch profile", err))
      .finally(() => setProfileLoading(false));
  }, []);

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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let base64 = reader.result as string;
        // Strip data:mime/type;base64, prefix
        base64 = base64.split(",")[1] || base64;
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Submit custom order → POST /api/orders
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
      // Convert selected files to base64 attachments
      const attachments = await Promise.all(selectedFiles.map(async file => ({
        FileName: file.name,
        MimeType: file.type || "application/octet-stream",
        Base64Data: await fileToBase64(file)
      })));

      // Calculate Deadline date based on delivery speed
      let deadlineDate = new Date();
      if (form.deadline === "standard") {
        deadlineDate.setDate(deadlineDate.getDate() + 10);
      } else if (form.deadline === "express") {
        deadlineDate.setDate(deadlineDate.getDate() + 5);
      } else if (form.deadline === "rush") {
        deadlineDate.setDate(deadlineDate.getDate() + 2);
      } else {
        deadlineDate.setDate(deadlineDate.getDate() + 14); // Default 2 weeks
      }

      // Route directly to VPS backend to bypass Vercel's 4.5 MB function payload limit.
      const res = await apiFetch(`${getApiBaseUrl()}/api/orders`, {
        method: "POST",
        body: JSON.stringify({
          ProjectName: form.projectName,
          ProductType: form.productType || null,
          Brief: form.description,
          Budget: form.budget || null,
          DeliverySpeed: form.deadline || null,
          ArOptimize: form.arOptimize,
          Animation: form.animation,
          MultiVariant: form.multiVariant,
          SourceFiles: form.sourceFiles,
          Deadline: deadlineDate.toISOString().split("T")[0], // Send YYYY-MM-DD
          Attachments: attachments,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Gửi yêu cầu thất bại.";
        try {
          const err = JSON.parse(text);
          errMsg = err.message || errMsg;
        } catch {
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      const newOrder = data.data ?? data;

      sessionStorage.setItem("customOrder", JSON.stringify(newOrder));

      // Add order to cart before redirecting
      addItem({
        orderId: String(newOrder.OrderId ?? newOrder.orderId ?? Date.now()),
        projectName: form.projectName,
        productType: form.productType || null,
        deliverySpeed: form.deadline || null,
        budget: form.budget || null,
        addedAt: new Date().toISOString(),
        status: "submitted",
      });
      openCart();

      // Redirect to success page with real order ID
      router.push(`/order-success?orderId=${newOrder.OrderId}`);
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Đặt hàng sản phẩm 3D/AR</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Chọn sản phẩm có sẵn hoặc đặt sản xuất 3D/AR tùy chỉnh
          </p>
        </motion.div>

        {/* Company Assignment Blocker */}
        {profileLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Order Type Toggle */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="text-white">Loại đơn hàng</CardTitle>
              <CardDescription className="text-gray-400">Chọn loại sản phẩm bạn muốn đặt</CardDescription>
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
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${orderType === "ready-made" ? "border-indigo-500 bg-indigo-500/10" : "border-purple-500/20 hover:border-purple-500/40"
                    }`}
                >
                  <RadioGroupItem value="ready-made" id="ready-made" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white">Sản phẩm có sẵn</span>
                    </div>
                    <p className="text-sm text-gray-400">Tải xuống ngay từ danh mục</p>
                  </div>
                </Label>

                {/* Custom */}
                <Label
                  htmlFor="custom"
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${orderType === "custom" ? "border-indigo-500 bg-indigo-500/10" : "border-purple-500/20 hover:border-purple-500/40"
                    }`}
                >
                  <RadioGroupItem value="custom" id="custom" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Sản xuất tùy chỉnh</span>
                    </div>
                    <p className="text-sm text-gray-400">3D/AR tùy chỉnh theo yêu cầu</p>
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
                <CardTitle className="text-white">Duyệt danh mục</CardTitle>
                <CardDescription className="text-gray-400">Tìm sản phẩm 3D/AR có sẵn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-400 text-sm">
                  Truy cập Marketplace để duyệt tất cả sản phẩm có sẵn và mua trực tiếp.
                </p>
                <Link href="/marketplace">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Đến Marketplace
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
                    <Label htmlFor="project-name" className="text-white">Tên dự án *</Label>
                    <Input
                      id="project-name"
                      placeholder="VD: Mô hình 3D điện thoại XYZ"
                      value={form.projectName}
                      onChange={(e) => updateForm("projectName", e.target.value)}
                      className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-slate-400"
                    />
                  </div>

                  {/* Product Type */}
                  <div className="space-y-2">
                    <Label htmlFor="product-type" className="text-white">Loại sản phẩm *</Label>
                    <Select onValueChange={(v) => updateForm("productType", v)}>
                      <SelectTrigger id="product-type" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30 text-white">
                        <SelectItem value="Electronics">Điện tử</SelectItem>
                        <SelectItem value="Furniture">Nội thất</SelectItem>
                        <SelectItem value="Fashion">Thời trang</SelectItem>
                        <SelectItem value="Automotive">Ô tô / Xe cộ</SelectItem>
                        <SelectItem value="Cosmetics">Mỹ phẩm</SelectItem>
                        <SelectItem value="Food & Beverage">Thực phẩm & Đồ uống</SelectItem>
                        <SelectItem value="Other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Mô tả chi tiết *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả sản phẩm: kích thước, màu sắc, chất liệu, yêu cầu đặc biệt..."
                    rows={5}
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    className="bg-[#0f1729] border-purple-500/30 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-white">Thời hạn mong muốn</Label>
                    <Select onValueChange={(v) => updateForm("deadline", v)}>
                      <SelectTrigger id="deadline" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Chọn thời hạn" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30 text-white">
                        <SelectItem value="standard">Tiêu chuẩn (7–10 ngày)</SelectItem>
                        <SelectItem value="express">Nhanh (3–5 ngày)</SelectItem>
                        <SelectItem value="rush">Khẩn cấp (1–2 ngày)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-white">Ngân sách dự kiến</Label>
                    <Select onValueChange={(v) => updateForm("budget", v)}>
                      <SelectTrigger id="budget" className="bg-[#0f1729] border-purple-500/30 text-white">
                        <SelectValue placeholder="Chọn ngân sách" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f3a] border-purple-500/30 text-white">
                        <SelectItem value="100k-250k">100.000 – 250.000 ₫</SelectItem>
                        <SelectItem value="250k-750k">250.000 – 750.000 ₫</SelectItem>
                        <SelectItem value="750k-1250k">750.000 – 1.250.000 ₫</SelectItem>
                        <SelectItem value="1250k+">Trên 1.250.000 ₫</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Tải lên tài liệu tham khảo</CardTitle>
                <CardDescription className="text-gray-400">Hình ảnh, bản vẽ hoặc tài liệu sản phẩm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept="image/*,.pdf,.doc,.docx" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Kéo thả hoặc nhấn để chọn tệp</p>
                    <p className="text-sm text-gray-400">JPG, PNG, PDF, DOC (Tối đa 10MB mỗi tệp)</p>
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
                <CardTitle className="text-white">Tùy chọn thêm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "arOptimize", label: "Tối ưu AR cho web & di động (+50.000 ₫)" },
                  { key: "animation", label: "Thêm hoạt ảnh 3D (+7.500.000 ₫)" },
                  { key: "multiVariant", label: "Nhiều biến thể màu/chất liệu (+350.000 ₫)" },
                  { key: "sourceFiles", label: "Bao gồm tệp nguồn có thể chỉnh sửa (+250.000 ₫)" },
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
                    <h3 className="text-white font-semibold mb-2">Bước tiếp theo là gì?</h3>
                    <ul className="text-sm text-gray-300 space-y-1 ml-2">
                      <li>• Đội ngũ của chúng tôi sẽ liên hệ trong vòng 24 giờ</li>
                      <li>• Xác nhận yêu cầu và báo giá chính xác</li>
                      <li>• Lên lịch chụp ảnh nếu cần</li>
                      <li>• Bắt đầu sản xuất 3D/AR</li>
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
                    Lưu bản nháp
                  </Button>
                  <Button
                    onClick={handleSubmitCustom}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Gửi yêu cầu
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
          </>
        )}
      </div>
    </div>
  );
}