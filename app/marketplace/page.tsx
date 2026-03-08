"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Search, Filter, Eye, Star, Play} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const categories = ["All", "Cosmetics", "Fashion", "Food & Beverage", "Electronics", "Home Decor"];

export const catalogItems = [
  {
    id: "1",
    title: "Luxury Lipstick AR Experience",
    description: "Interactive AR try-on for premium cosmetics with realistic color matching",
    category: "Cosmetics",
    rating: 4.9,
    downloads: 1240,
    image: "https://images.unsplash.com/photo-1704621354138-e124277356f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpYyUyMHByb2R1Y3QlMjBiZWF1dHl8ZW58MXx8fHwxNzcyNDQxNTIzfDA&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["AR", "Beauty", "Interactive"],
    price: "$299",
  },
  {
    id: "2",
    title: "Fashion Collection 3D Showcase",
    description: "High-end clothing line with 360° rotation and fabric detail visualization",
    category: "Fashion",
    rating: 4.8,
    downloads: 980,
    image: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbHV4dXJ5JTIwY2xvdGhpbmd8ZW58MXx8fHwxNzcyNDQxNTI1fDA&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["3D", "Fashion", "Luxury"],
    price: "$499",
  },
  {
    id: "3",
    title: "Gourmet Food Presentation",
    description: "Photorealistic 3D food models for menu displays and social media",
    category: "Food & Beverage",
    rating: 5.0,
    downloads: 1560,
    image: "https://images.unsplash.com/photo-1761076879115-97f22dc68755?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMGFkdmVydGlzaW5nfGVufDF8fHx8MTc3MjQ0MTUyNHww&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["3D", "Food", "Photography"],
    price: "$349",
  },
  {
    id: "4",
    title: "Smart Device AR Demo",
    description: "Interactive product demo with feature highlights and AR placement",
    category: "Electronics",
    rating: 4.7,
    downloads: 2100,
    image: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzRCUyMGhvbG9ncmFtJTIwZGlnaXRhbCUyMGludGVyZmFjZXxlbnwxfHx8fDE3NzI0NDE1Mjd8MA&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["AR", "Tech", "Interactive"],
    price: "$599",
  },
  {
    id: "5",
    title: "Furniture Placement AR",
    description: "Home decor visualization with real-time AR placement and sizing",
    category: "Home Decor",
    rating: 4.9,
    downloads: 1780,
    image: "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwcmVhbGl0eSUyMEFSJTIwZnV0dXJpc3RpYyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcyNDQxNTI0fDA&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["AR", "Home", "Design"],
    price: "$449",
  },
  {
    id: "6",
    title: "Skincare Product Line",
    description: "Complete skincare range with ingredient visualization and benefits",
    category: "Cosmetics",
    rating: 4.8,
    downloads: 1320,
    image: "https://images.unsplash.com/photo-1704621354138-e124277356f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3NtZXRpYyUyMHByb2R1Y3QlMjBiZWF1dHl8ZW58MXx8fHwxNzcyNDQxNTIzfDA&ixlib=rb-4.1.0&q=80&w=400",
    tags: ["3D", "Beauty", "Education"],
    price: "$399",
  },
];

export default function MarketPlacePage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const filteredItems = catalogItems.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const handlePurchase = (itemId: string) => {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        router.push(`/checkout?itemId=${itemId}`);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
            3D/AR Content Market Place
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Browse our collection of professional 3D models and AR experiences across industries
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12
                        h-12
                        rounded-xl
                        bg-slate-900/60
                        border border-slate-700
                        text-white
                        placeholder:text-slate-500
                        focus:border-cyan-500
                        focus:ring-1
                        focus:ring-cyan-500
                        transition
                        "
            />
          </div>

          {/* Category Filter */}
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
                    : "border-blue-500/30 hover:border-cyan-500/50"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
          </p>
          <Button variant="outline" size="sm" className="border-blue-500/30">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Catalog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur overflow-hidden group hover:border-cyan-500/40 transition-all h-full flex flex-col">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-blue-600/90 hover:bg-blue-600">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/marketplace/${item.id}`}>
                      <Button size="sm" className="bg-white/90 text-slate-900 hover:bg-white">
                        <Play className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </Link>
                  </div>
                </div>

                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-white">{item.rating}</span>
                    </div>
                    <span className="text-gray-400 text-sm">• {item.downloads} downloads</span>
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-blue-500/30 text-cyan-400 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">{item.price}</span>
                    <div className="flex gap-2">
                      <Link href={`/marketplace/${item.id}`}>
                        <Button size="sm" variant="outline" className="border-blue-500/50">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => handlePurchase(item.id)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600"
                      >
                        Purchase
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
            <p className="text-gray-400 text-lg">No items found matching your criteria.</p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              variant="outline"
              className="mt-4 border-blue-500/50"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}