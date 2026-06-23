"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { ErrorState } from "@/app/components/ui/error-state";
import { Search, Filter, Eye, Star, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMarketplaceAssets } from "@/hooks/queries/useAssets";
import type { Asset } from "@/lib/types";

const DEFAULT_ASSET_IMAGE = "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400";

const getAssetImage = (asset: Asset) => asset.PreviewImage || DEFAULT_ASSET_IMAGE;

export default function MarketPlacePage() {
  const { data: assets = [], isLoading, isError, error, refetch } = useMarketplaceAssets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Derived list of unique categories — memoised so it doesn't recompute on every keystroke
  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(assets.map((a) => a.Category).filter(Boolean) as string[]))],
    [assets]
  );

  // Filtered asset list — memoised to avoid scanning the full array on every render
  const filteredItems = useMemo(
    () =>
      assets.filter((item) => {
        const matchCategory = selectedCategory === "Tất cả" || item.Category === selectedCategory;
        const matchSearch =
          item.AssetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.Description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      }),
    [assets, searchQuery, selectedCategory]
  );

  const handleViewDetail = (assetId: number) => router.push(`/marketplace/${assetId}`);

  const handlePurchase = (asset: Asset) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/marketplace/checkout?productId=${asset.AssetId}`);
      return;
    }
    // Only store lightweight metadata — Base64Data can be MB-sized and exceed sessionStorage quota
    const { Base64Data: _, ...checkoutPayload } = asset;
    try {
      sessionStorage.setItem("checkoutProduct", JSON.stringify(checkoutPayload));
    } catch {
      sessionStorage.removeItem("checkoutProduct"); // quota full → checkout will refetch from API
    }
    router.push(`/marketplace/checkout?productId=${asset.AssetId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen -mt-25 pt-25 flex items-center justify-center" style={{ background: "var(--gradient-page)" }}>
        <LoadingSpinner size="lg" color="cyan" label="Đang tải marketplace..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen -mt-25 pt-25 flex items-center justify-center" style={{ background: "var(--gradient-page)" }}>
        <ErrorState message={error?.message || "Không thể tải danh sách sản phẩm."} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16" style={{ background: "var(--gradient-page)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
            Marketplace 3D/AR
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Khám phá bộ sưu tập mô hình 3D và trải nghiệm AR chuyên nghiệp đa ngành nghề
          </p>
          {!isAuthenticated && (
            <p className="mt-3 text-sm text-yellow-400/80">ℹ️ Đăng nhập để mua sản phẩm</p>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "text-white"
                    : "border-blue-500/30 hover:border-cyan-500/50 text-slate-300"
                }
                style={selectedCategory === category ? { background: "var(--gradient-accent)" } : {}}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Count + filter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Tìm thấy {filteredItems.length} sản phẩm
          </p>
          <Button variant="outline" size="sm" className="border-blue-500/30 text-slate-300">
            <Filter className="w-4 h-4 mr-2" /> Lọc thêm
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map((asset, index) => (
            <motion.div
              key={asset.AssetId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur overflow-hidden group hover:border-cyan-500/40 transition-all h-full flex flex-col">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={getAssetImage(asset)}
                    alt={asset.AssetName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  {asset.Category && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-600/90">{asset.Category}</Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      className="bg-white/90 text-slate-900 hover:bg-white"
                      onClick={() => handleViewDetail(asset.AssetId)}
                    >
                      <Play className="w-4 h-4 mr-1" /> Xem trước
                    </Button>
                  </div>
                </div>

                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-400 text-sm">{asset.Industry ?? "Tài sản 3D"}</span>
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {asset.AssetName}
                  </CardTitle>
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {asset.Description ?? "Chưa có mô tả."}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {asset.Industry && (
                      <Badge variant="outline" className="border-blue-500/30 text-cyan-400 text-xs">{asset.Industry}</Badge>
                    )}
                    <Badge variant="outline" className="border-blue-500/30 text-cyan-400 text-xs">3D/AR</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-cyan-400">
                      {asset.Price != null ? `${asset.Price.toLocaleString("vi-VN")} ₫` : "Liên hệ để biết giá"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/50 text-slate-300"
                        onClick={() => handleViewDetail(asset.AssetId)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(asset)}
                        style={{ background: "var(--gradient-accent)" }}
                        className="text-white"
                      >
                        {isAuthenticated ? "Mua ngay" : "Đăng nhập để mua"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Không tìm thấy sản phẩm phù hợp.</p>
            <Button
              onClick={() => { setSearchQuery(""); setSelectedCategory("Tất cả"); }}
              variant="outline"
              className="mt-4 border-blue-500/50 text-slate-300"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}