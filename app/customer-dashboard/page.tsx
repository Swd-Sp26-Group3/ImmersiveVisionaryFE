"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Package, 
  FileText, 
  Download, 
  Plus, 
  Edit, 
  Eye, 
  MessageSquare,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
  const orders = [
    {
      id: "ORD-001",
      title: "Luxury Perfume AR Campaign",
      status: "In 3D Modeling",
      progress: 65,
      date: "2026-02-28",
      thumbnail: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
    },
    {
      id: "ORD-002",
      title: "Fashion Collection Showcase",
      status: "Waiting for Photo Shoot",
      progress: 30,
      date: "2026-02-25",
      thumbnail: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
    },
    {
      id: "ORD-003",
      title: "Food Menu 3D Visualization",
      status: "Completed",
      progress: 100,
      date: "2026-02-20",
      thumbnail: "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=400",
    },
  ];

  const purchases = [
    {
      id: "PUR-001",
      title: "Premium Cosmetics Pack",
      date: "2026-02-15",
      price: "$299",
    },
    {
      id: "PUR-002",
      title: "AR Furniture Bundle",
      date: "2026-02-10",
      price: "$449",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "In 3D Modeling":
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-600";
      case "In 3D Modeling":
        return "bg-blue-600";
      default:
        return "bg-yellow-600";
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Customer Dashboard</h1>
            <p className="text-gray-400">Manage your orders, briefs, and content</p>
          </div>
          <Link href="/order" >
            <Button 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Notifications Banner */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-white font-medium">Order ORD-001 is now in 3D Modeling phase!</p>
                <p className="text-sm text-gray-300">Preview will be available for review soon</p>
              </div>
              <Button size="sm" variant="outline" className="border-cyan-500/50">
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">2</div>
              <p className="text-xs text-green-400 mt-1">+1 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">1</div>
              <p className="text-xs text-gray-400 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">$2,547</div>
              <p className="text-xs text-gray-400 mt-1">Lifetime value</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="briefs">
              <FileText className="w-4 h-4 mr-2" />
              Briefs
            </TabsTrigger>
            <TabsTrigger value="purchases">
              <Download className="w-4 h-4 mr-2" />
              Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.thumbnail}
                          alt={order.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-white">{order.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-sm text-gray-400">• Order {order.id}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Progress:</span>
                            <div className="flex-1 max-w-xs">
                              <Progress value={order.progress} className="h-2" />
                            </div>
                            <span>{order.progress}%</span>
                          </div>
                          <p className="text-sm text-gray-400">Started: {order.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-blue-500/50">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Brief
                      </Button>
                      {order.status === "Completed" && (
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                      {order.status !== "Completed" && (
                        <Button size="sm" variant="outline" className="border-cyan-500/50">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="border-cyan-500/50">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="briefs">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Create New Brief</CardTitle>
                <CardDescription className="text-gray-400">
                  Start a custom 3D/AR content order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/order">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Brief
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{purchase.title}</CardTitle>
                      <CardDescription className="text-gray-400">
                        Purchased on {purchase.date} • {purchase.id}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-white">{purchase.price}</span>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/marketplace">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <Package className="w-8 h-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">Browse Marktet Place</CardTitle>
                <CardDescription className="text-gray-300">
                  Explore ready-made 3D/AR content
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer">
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Get Consultation</CardTitle>
              <CardDescription className="text-gray-300">
                Talk to our experts about your project
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
