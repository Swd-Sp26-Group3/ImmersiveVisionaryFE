"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Loader2, AlertCircle,
  Box, CheckCircle2, Tag, Building2, View, X
} from "lucide-react";
import DynamicOBJModelViewer from "@/app/components/3d/OBJModelViewer";

// Asset3D 
interface Asset {
  AssetId: number;
  AssetName: string;
  Description: string | null;
  Category: string | null;
  Industry: string | null;
  Price: number | null;
  PreviewImage: string | null;
  Base64Data: string | null;
  PublishStatus: string;
  IsMarketplace: boolean | number;
  OwnerCompanyId: number | null;
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

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show3D, setShow3D] = useState(false);

  // GET /api/assets/:id
  useEffect(() => {
    if (!id) return;
    apiFetch(`/assets/${id}`)
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => setAsset(data.data ?? data))
      .catch((e) => setError(`Asset not found. (${e.message})`))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePurchase = () => {
    if (!asset) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/marketplace/checkout?productId=${asset.AssetId}`);
      return;
    }
    // Cache asset — checkout dùng luôn, không cần fetch lại
    sessionStorage.setItem("checkoutProduct", JSON.stringify(asset));
    router.push(`/marketplace/checkout?productId=${asset.AssetId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Loading asset...</p>
      </div>
    </div>
  );

  if (error || !asset) return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-4">{error || "Asset not found."}</p>
        <Button onClick={() => router.push("/marketplace")} variant="outline" className="border-slate-600 text-white">
          Back to Marketplace
        </Button>
      </div>
    </div>
  );

  const assetImage = asset.PreviewImage ||
    CATEGORY_IMAGES[asset.Category ?? "default"] ||
    CATEGORY_IMAGES.default;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] py-16 text-white">
      <div className="max-w-5xl mx-auto px-6">

        <button
          onClick={() => router.push("/marketplace")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl relative bg-slate-900/40 min-h-[400px]"
          >
            {show3D && asset?.Base64Data ? (
              <div className="w-full h-[400px]">
                <DynamicOBJModelViewer objData={asset.Base64Data} />
                <button
                  onClick={() => setShow3D(false)}
                  className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={assetImage}
                  alt={asset.AssetName}
                  className="w-full h-[400px] object-cover"
                />
                {asset?.Base64Data && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => setShow3D(true)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white gap-2"
                    >
                      <View className="w-4 h-4" /> View 3D Mode
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {asset.Category && (
                <Badge className="bg-blue-600 text-sm px-3 py-1">{asset.Category}</Badge>
              )}
              {asset.Industry && (
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-sm px-3 py-1">
                  {asset.Industry}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight">{asset.AssetName}</h1>

            <p className="text-slate-400 leading-relaxed">
              {asset.Description ?? "No description available for this asset."}
            </p>

            {/* Specs */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                <Box className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Asset ID</p>
                  <p className="text-white text-sm font-mono">#{asset.AssetId}</p>
                </div>
              </div>
              {asset.Category && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                  <Tag className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                    <p className="text-white text-sm">{asset.Category}</p>
                  </div>
                </div>
              )}
              {asset.Industry && (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                  <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Industry</p>
                    <p className="text-white text-sm">{asset.Industry}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Included */}
            <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4">
              <p className="text-white font-semibold text-sm mb-2">What's included</p>
              <ul className="space-y-1.5">
                {["All available formats (GLB, USDZ, FBX, WebAR)", "Commercial use license", "Download from dashboard after purchase"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="rounded-xl p-5 flex items-center justify-between bg-slate-800/80 border border-blue-500/20">
              <div>
                <p className="text-slate-400 text-xs mb-1">Price</p>
                <span className="text-2xl font-bold text-cyan-400">
                  {asset.Price != null ? `${asset.Price.toLocaleString("vi-VN")} ₫` : "Contact for quote"}
                </span>
              </div>
              <Button
                onClick={handlePurchase}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isAuthenticated ? "Purchase Now" : "Login to Buy"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}