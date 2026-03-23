"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Package, FileText, Download, Plus, MessageSquare, Loader2, User } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { MOCK_PURCHASES, UserProfile, ApiOrder } from "./components/types";
import { OrdersTab } from "./components/OrderTab";
import { BriefsTab } from "./components/BriefsTab";
import { PurchasesTab } from "./components/PurchasesTab";
import { ProfileTab } from "./components/ProfileTab";

const TABS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "briefs", label: "Briefs", icon: FileText },
  { id: "purchases", label: "Purchases", icon: Download },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = typeof TABS[number]["id"];

interface MarketplaceOrder {
  MpOrderId: number;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Real purchase stats
  const [purchases, setPurchases] = useState<MarketplaceOrder[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users/profile")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setProfile(d.data ?? d))
      .catch(e => console.error("Profile fetch error:", e))
      .finally(() => setProfileLoading(false));

    // Fetch real orders from GET /api/orders/my
    apiFetch("/orders/my")
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          if (r.status === 400 && (text.includes("company") || text.includes("User is not associated"))) {
            return { data: [] };
          }
          throw new Error(text);
        }
        return r.json();
      })
      .then(d => { const arr = d.data ?? d; setOrders(Array.isArray(arr) ? arr : []); })
      .catch((err) => console.error("Orders fetch error (Expected if new user):", err))
      .finally(() => setOrdersLoading(false));

    apiFetch("/marketplace-orders/my")
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          if (r.status === 400 && (text.includes("company") || text.includes("Buyer company not found"))) {
            return { data: [] };
          }
          return { data: [] }; // fallback for marketplace orders
        }
        return r.json();
      })
      .then(d => setPurchases(Array.isArray(d.data ?? d) ? (d.data ?? d) : []))
      .catch(() => setPurchases([]))
      .finally(() => setPurchasesLoading(false));
  }, []);

  const totalPurchases = purchases.length;
  const pendingPurchases = purchases.filter(p => p.Status === "PENDING").length;
  const deliveredCount = purchases.filter(p => p.Status === "DELIVERED").length;

  const activeOrders = orders.filter(
    (o) => o.Status !== "COMPLETED" && o.Status !== "DELIVERED" && o.Status !== "CANCELLED"
  ).length;
  const completedOrders = orders.filter(
    (o) => o.Status === "COMPLETED" || o.Status === "DELIVERED"
  ).length;

  const STATS = [
    {
      label: "Total Purchases",
      value: purchasesLoading ? null : totalPurchases,
      sub: "All time",
      subColor: "text-gray-400",
    },
    {
      label: "Pending",
      value: purchasesLoading ? null : pendingPurchases,
      sub: "Awaiting confirmation",
      subColor: "text-yellow-400",
    },
    {
      label: "Delivered",
      value: purchasesLoading ? null : deliveredCount,
      sub: "Ready to download",
      subColor: "text-cyan-400",
    },
    {
      label: "Member Since",
      value: null, // rendered separately
      sub: profile?.RoleName ?? "Customer",
      subColor: "text-gray-400",
      isMember: true,
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {profileLoading ? (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-gray-400">Loading profile...</span>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white">
                  Welcome, {profile?.UserName ?? "Customer"} 👋
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-sm">{profile?.Email}</p>
                  {profile?.RoleName && (
                    <Badge className="bg-blue-600/80 text-xs">{profile.RoleName}</Badge>
                  )}
                  {profile?.CompanyName && (
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-xs">
                      {profile.CompanyName}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
          <Link href="/order">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Orders", value: ordersLoading ? "..." : activeOrders, sub: "In progress", subColor: "text-green-400" },
            { label: "Completed", value: ordersLoading ? "..." : completedOrders, sub: "All time", subColor: "text-gray-400" },
            { label: "Total Orders", value: ordersLoading ? "..." : orders.length, sub: "All time", subColor: "text-gray-400" },
          ].map(({ label, value, sub, subColor }) => (
            <Card key={label} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                {value === null ? (
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                ) : (
                  <div className="text-3xl font-bold text-white">{value}</div>
                )}
                <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
              </CardContent>
            </Card>
          ))}

          {/* Member since */}
          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Member Since</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">
                {profile?.CreatedAt
                  ? new Date(profile.CreatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : "—"}
              </div>
              <p className="text-xs text-gray-400 mt-1">{profile?.RoleName ?? "Customer"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {/* Badge số pending trên tab Purchases */}
                {id === "purchases" && pendingPurchases > 0 && (
                  <span className="ml-1 text-xs bg-yellow-500/30 text-yellow-300 rounded-full px-1.5 py-0.5 leading-none">
                    {pendingPurchases}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "orders" && <OrdersTab onTabChange={setActiveTab} />}
            {activeTab === "briefs" && <BriefsTab />}
            {activeTab === "purchases" && <PurchasesTab />}
            {activeTab === "profile" && (
              <ProfileTab profile={profile} loading={profileLoading} onProfileUpdated={setProfile} />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/marketplace">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <Package className="w-8 h-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">Browse Marketplace</CardTitle>
                <CardDescription className="text-gray-300">Explore ready-made 3D/AR content</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Get Consultation</CardTitle>
              <CardDescription className="text-gray-300">Talk to our experts about your project</CardDescription>
            </CardHeader>
          </Card>
        </div>

      </div>
    </div>
  );
}