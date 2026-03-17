"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Search, Filter, Eye, Star, Play, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

// Asset3D schema từ DB
interface Asset {
  AssetId: number;
  AssetName: string;
  Description: string | null;
  Category: string | null;
  Industry: string | null;
  Price: number | null;
  PreviewImage: string | null;
  PublishStatus: string;
  IsMarketplace: boolean | number;
  OwnerCompanyId: number | null;
  CreatedAt: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Cosmetics: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
  Fashion: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
  "Food & Beverage": "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=400",
  Electronics: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
  "Home Decor": "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?w=400",
  default: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
};

const getAssetImage = (asset: Asset) =>
  asset.PreviewImage ||
  CATEGORY_IMAGES[asset.Category ?? "default"] ||
  CATEGORY_IMAGES.default;

export default function MarketPlacePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // GET /api/assets/marketplace — IsMarketplace=1, PublishStatus='PUBLISHED'
  useEffect(() => {
    apiFetch("/assets/marketplace")
      .then((res) => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then((data) => setAssets(data.data ?? data))
      .catch((e) => setError(`Cannot load marketplace assets. (${e.message})`))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(assets.map((a) => a.Category).filter(Boolean) as string[])),
  ];

  const filteredItems = assets.filter((item) => {
    const matchCategory = selectedCategory === "All" || item.Category === selectedCategory;
    const matchSearch =
      item.AssetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.Description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleViewDetail = (assetId: number) => router.push(`/marketplace/${assetId}`);

  const handlePurchase = (asset: Asset) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/marketplace/checkout?productId=${asset.AssetId}`);
      return;
    }
    // Cache asset vào sessionStorage để checkout không cần fetch lại
    sessionStorage.setItem("checkoutProduct", JSON.stringify(asset));
    router.push(`/marketplace/checkout?productId=${asset.AssetId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading marketplace...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-cyan-600">
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] py-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
            3D/AR Content Marketplace
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Browse our collection of professional 3D models and AR experiences across industries
          </p>
          {!isAuthenticated && (
            <p className="mt-3 text-sm text-yellow-400/80">
              ℹ️ Login to purchase assets
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or description..."
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
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                    : "border-blue-500/30 hover:border-cyan-500/50 text-slate-300"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {filteredItems.length} {filteredItems.length === 1 ? "asset" : "assets"} found
          </p>
          <Button variant="outline" size="sm" className="border-blue-500/30 text-slate-300">
            <Filter className="w-4 h-4 mr-2" /> More Filters
          </Button>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Play className="w-4 h-4 mr-1" /> Preview
                    </Button>
                  </div>
                </div>

                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-400 text-sm">{asset.Industry ?? "3D Asset"}</span>
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {asset.AssetName}
                  </CardTitle>
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {asset.Description ?? "No description available."}
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
                      {asset.Price != null ? `${asset.Price.toLocaleString("vi-VN")} ₫` : "Contact for price"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="border-blue-500/50 text-slate-300"
                        onClick={() => handleViewDetail(asset.AssetId)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(asset)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600"
                      >
                        {isAuthenticated ? "Purchase" : "Login to buy"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No assets found matching your criteria.</p>
            <Button
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              variant="outline" className="mt-4 border-blue-500/50 text-slate-300"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}