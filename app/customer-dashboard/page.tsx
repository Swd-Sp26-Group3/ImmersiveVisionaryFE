"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Package, FileText, Download, Plus, MessageSquare, Bell, Loader2, User } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { MOCK_ORDERS, MOCK_PURCHASES, UserProfile } from "./components/types";
import { OrdersTab } from "./components/OrderTab";
import { BriefsTab } from "./components/BriefsTab";
import { PurchasesTab } from "./components/PurchasesTab";
import { ProfileTab } from "./components/ProfileTab";



// Tab config
const TABS = [
  { id: "orders",    label: "Orders",    icon: Package },
  { id: "briefs",    label: "Briefs",    icon: FileText },
  { id: "purchases", label: "Purchases", icon: Download },
  { id: "profile",   label: "Profile",   icon: User },
] as const;

type TabId = typeof TABS[number]["id"];

export default function CustomerDashboard() {
  const [activeTab, setActiveTab]           = useState<TabId>("orders");
  const [profile, setProfile]               = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users/profile")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setProfile(data.data ?? data))
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => setProfileLoading(false));
  }, []);

  const activeOrders    = MOCK_ORDERS.filter((o) => o.status !== "Completed").length;
  const completedOrders = MOCK_ORDERS.filter((o) => o.status === "Completed").length;

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

        {/* Notification Banner */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white font-medium">Order ORD-001 is now in 3D Modeling phase!</p>
                <p className="text-sm text-gray-300">Preview will be available for review soon</p>
              </div>
              <Button size="sm" variant="outline" className="border-cyan-500/50 text-white">
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Orders",    value: activeOrders,            sub: "In progress",   subColor: "text-green-400" },
            { label: "Completed",        value: completedOrders,          sub: "This month",    subColor: "text-gray-400"  },
            { label: "Total Purchases",  value: MOCK_PURCHASES.length,    sub: "All time",      subColor: "text-gray-400"  },
          ].map(({ label, value, sub, subColor }) => (
            <Card key={label} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{value}</div>
                <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
              </CardContent>
            </Card>
          ))}

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

        {/* ✅ Custom Tabs với purple gradient */}
        <div className="space-y-6">
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "orders"    && <OrdersTab />}
            {activeTab === "briefs"    && <BriefsTab />}
            {activeTab === "purchases" && <PurchasesTab />}
            {activeTab === "profile"   && <ProfileTab profile={profile} loading={profileLoading} />}
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