"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Loader2, ShieldCheck, ArrowLeft, CreditCard, AlertCircle } from "lucide-react";

interface Product {
  ProductId: number;
  ProductName: string;
  Description: string | null;
  Category: string | null;
  SizeInfo: string | null;
  ColorInfo: string | null;
  CompanyId: number;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Cosmetics: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
  Fashion: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
  "Food & Beverage": "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=400",
  Electronics: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
  "Home Decor": "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?w=400",
  default: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ✅ Đọc product: ưu tiên sessionStorage, fallback fetch API
  useEffect(() => {
    const cached = sessionStorage.getItem("checkoutProduct");
    if (cached) {
      try {
        setProduct(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // parse lỗi → fallback fetch
      }
    }

    // Fallback: fetch lại từ API nếu không có cache
    if (productId) {
      apiFetch(`/products/${productId}`) // GET /api/products/:id
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => setProduct(data.data ?? data))
        .catch(() => setError("Không thể tải thông tin sản phẩm."))
        .finally(() => setLoading(false));
    } else {
      setError("Không tìm thấy sản phẩm.");
      setLoading(false);
    }
  }, [productId]);

  // ✅ Xử lý confirm payment
  const handleConfirmPayment = async () => {
    if (!product) return;
    setSubmitting(true);
    setError("");

    try {
      // Khi BE có payment endpoint, uncomment đoạn này:
      // const res = await apiFetch("/payments", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     AssetId: product.ProductId,
      //     CompanyId: user?.companyId,
      //     PaymentType: "ASSET",
      //     Amount: 0,           // thay bằng price thật khi BE có
      //     PaymentStatus: "PENDING",
      //   }),
      // });
      // if (!res.ok) {
      //   const err = await res.json();
      //   throw new Error(err.message ?? "Thanh toán thất bại");
      // }

      // ✅ Hiện tại: mock success, xóa cache rồi redirect
      sessionStorage.removeItem("checkoutProduct");
      router.push(`/order-success?productId=${product.ProductId}&name=${encodeURIComponent(product.ProductName)}`);
    } catch (err: any) {
      setError(err.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // --- No product ---
  if (!product) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error || "Không tìm thấy sản phẩm."}</p>
          <Button onClick={() => router.push("/marketplace")} variant="outline" className="border-slate-600 text-white">
            Quay lại Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const productImage =
    CATEGORY_IMAGES[product.Category ?? "default"] ?? CATEGORY_IMAGES.default;

  // --- Main ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] py-16 text-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Order Summary */}
          <div className="md:col-span-3 space-y-4">
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-blue-500/20">
                    <img src={productImage} alt={product.ProductName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{product.ProductName}</h3>
                    {product.Category && (
                      <Badge className="bg-blue-600/80 text-xs mb-2">{product.Category}</Badge>
                    )}
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {product.Description ?? "3D/AR Content Product"}
                    </p>
                  </div>
                </div>

                {/* Specs */}
                {(product.SizeInfo || product.ColorInfo) && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                    {product.SizeInfo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Size</span>
                        <span className="text-white">{product.SizeInfo}</span>
                      </div>
                    )}
                    {product.ColorInfo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Color</span>
                        <span className="text-white">{product.ColorInfo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price row */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="text-cyan-400 font-bold text-lg">To be confirmed</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Our team will contact you with the final price.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Buyer info */}
            {user && (
              <Card className="bg-slate-800/50 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Buyer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name</span>
                    <span className="text-white">{user.name ?? user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role</span>
                    <span className="text-white">{user.role}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Payment Panel */}
          <div className="md:col-span-2">
            <Card className="bg-slate-800/50 border-blue-500/20 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700 text-sm text-slate-400">
                  Payment gateway will be integrated here. After confirming, our team will reach out to complete the transaction.
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-6 text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Confirm Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  By confirming, you agree to our Terms of Service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}