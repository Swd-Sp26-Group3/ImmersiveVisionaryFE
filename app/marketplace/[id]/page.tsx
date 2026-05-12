"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { motion } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, AlertCircle,
  Box, CheckCircle2, Tag, Building2, View, X,
} from "lucide-react";
import DynamicOBJModelViewer from "@/app/components/3d/OBJModelViewer";
import type { Asset } from "@/lib/types";

// Only the lightweight fields needed by checkout page — no Base64Data
type CheckoutAsset = Pick<Asset,
  "AssetId" | "AssetName" | "Description" | "Category" | "Industry" | "Price" | "PreviewImage"
>;

const DEFAULT_ASSET_IMAGE = "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=800";

const INCLUDED_ITEMS = [
  "All available formats (GLB, USDZ, FBX, WebAR)",
  "Commercial use license",
  "Download from dashboard after purchase",
];

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show3D, setShow3D] = useState(false);

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

    // ✅ Only store lightweight metadata — omit Base64Data to stay within sessionStorage quota
    const checkoutPayload: CheckoutAsset = {
      AssetId:      asset.AssetId,
      AssetName:    asset.AssetName,
      Description:  asset.Description,
      Category:     asset.Category,
      Industry:     asset.Industry,
      Price:        asset.Price,
      PreviewImage: asset.PreviewImage,
    };

    try {
      sessionStorage.setItem("checkoutProduct", JSON.stringify(checkoutPayload));
    } catch {
      // sessionStorage full — proceed without cache, checkout will fetch from API
      sessionStorage.removeItem("checkoutProduct");
    }

    router.push(`/marketplace/checkout?productId=${asset.AssetId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-page)" }}>
        <LoadingSpinner size="lg" color="cyan" label="Loading asset..." />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-page)" }}>
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error || "Asset not found."}</p>
          <Button onClick={() => router.push("/marketplace")} variant="outline" className="border-slate-600 text-white">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const assetImage = asset.PreviewImage || DEFAULT_ASSET_IMAGE;

  return (
    <div className="min-h-screen py-16 text-white" style={{ background: "var(--gradient-page)" }}>
      <div className="max-w-5xl mx-auto px-6">

        <button
          onClick={() => router.push("/marketplace")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Left: Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl relative bg-slate-900/40 min-h-[400px]"
          >
            {show3D && asset.Base64Data ? (
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
                {asset.Base64Data && (
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

          {/* Right: Info */}
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
              {[
                { icon: Box,       label: "Asset ID",  value: `#${asset.AssetId}` },
                ...(asset.Category ? [{ icon: Tag,      label: "Category", value: asset.Category }] : []),
                ...(asset.Industry ? [{ icon: Building2, label: "Industry", value: asset.Industry }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3 border border-blue-500/10">
                  <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                    <p className="text-white text-sm font-mono">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Included */}
            <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4">
              <p className="text-white font-semibold text-sm mb-2">What's included</p>
              <ul className="space-y-1.5">
                {INCLUDED_ITEMS.map((item) => (
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
                className="text-white px-8"
                style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 20px rgba(6,182,212,0.25)" }}
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