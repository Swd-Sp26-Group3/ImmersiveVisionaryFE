"use client";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Star, Download, ArrowLeft, ShoppingCart } from "lucide-react";
import { catalogItems } from "../page";

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const item = catalogItems.find((i) => i.id === id);
  if (!item) return <div className="text-white p-20">Item not found</div>;

  const handlePurchase = () => {
    if (!isAuthenticated) router.push("/login");
    else router.push(`/checkout?itemId=${item.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] py-16 text-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-blue-500/20">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-blue-600">{item.category}</Badge>
            <h1 className="text-3xl font-bold">{item.title}</h1>
            <p className="text-slate-400 leading-relaxed">{item.description}</p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{item.rating}</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-1 text-slate-400">
                <Download className="w-4 h-4" />
                <span>{item.downloads} downloads</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-blue-500/30 text-cyan-400">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Price + CTA */}
            <div
              className="rounded-xl p-6 flex items-center justify-between"
              style={{ background: "rgba(20,25,55,0.85)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <span className="text-4xl font-bold">{item.price}</span>
              <Button
                onClick={handlePurchase}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Purchase Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}