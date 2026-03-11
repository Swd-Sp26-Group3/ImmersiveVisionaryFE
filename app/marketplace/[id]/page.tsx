"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, ShoppingCart, Loader2, AlertCircle, Box, Palette, Ruler } from "lucide-react";

interface Product {
  ProductId: number;
  ProductName: string;
  Description: string | null;
  Category: string | null;
  SizeInfo: string | null;
  ColorInfo: string | null;
  CompanyId: number;
  CreatedAt: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Cosmetics: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=800",
  Fashion: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=800",
  "Food & Beverage": "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=800",
  Electronics: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=800",
  "Home Decor": "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?w=800",
  default: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=800",
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch chi tiết product từ API
  useEffect(() => {
    if (!id) return;
    apiFetch(`/products/${id}`) // GET /api/products/:id
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        // BE trả về { message: "...", data: {...} }
        setProduct(data.data ?? data);
      })
      .catch(() => setError("Không tìm thấy sản phẩm."))
      .finally(() => setLoading(false));
  }, [id]);

  //  Lưu product vào sessionStorage rồi chuyển sang checkout
  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Lưu để /checkout đọc lại, tránh fetch thêm lần nữa
    sessionStorage.setItem("checkoutProduct", JSON.stringify(product));
    router.push(`/checkout?productId=${product?.ProductId}`);
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error || "Sản phẩm không tồn tại."}</p>
          <Button onClick={() => router.back()} variant="outline" className="border-slate-600 text-white">
            Quay lại
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
      <div className="max-w-5xl mx-auto px-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl">
            <img
              src={productImage}
              alt={product.ProductName}
              className="w-full h-80 object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product.Category && (
              <Badge className="w-fit bg-blue-600 text-sm px-3 py-1">
                {product.Category}
              </Badge>
            )}

            <h1 className="text-3xl font-bold leading-tight">{product.ProductName}</h1>

            <p className="text-slate-400 leading-relaxed">
              {product.Description ?? "No description available for this product."}
            </p>

            {/* Specs */}
            <div className="grid grid-cols-1 gap-3">
              {product.SizeInfo && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                  <Ruler className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Size Info</p>
                    <p className="text-white text-sm">{product.SizeInfo}</p>
                  </div>
                </div>
              )}
              {product.ColorInfo && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                  <Palette className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Color Info</p>
                    <p className="text-white text-sm">{product.ColorInfo}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                <Box className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Product ID</p>
                  <p className="text-white text-sm">#{product.ProductId}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl p-5 flex items-center justify-between bg-slate-800/80 border border-blue-500/20 mt-2">
              <div>
                <p className="text-slate-400 text-xs mb-1">Price</p>
                <span className="text-2xl font-bold text-cyan-400">Contact for quote</span>
              </div>
              <Button
                onClick={handlePurchase}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Purchase Now
              </Button>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-slate-500 text-center">
                You need to{" "}
                <button onClick={() => router.push("/login")} className="text-cyan-400 underline">
                  log in
                </button>{" "}
                to purchase.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}