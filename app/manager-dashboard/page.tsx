'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  BarChart3,
  Settings,
  Download
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function ManagerDashboard() {
  const revenueData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 18000 },
  ];

  const orderStatusData = [
    { name: "Completed", value: 45, color: "#10b981" },
    { name: "In Progress", value: 35, color: "#3b82f6" },
    { name: "Pending", value: 20, color: "#f59e0b" },
  ];

  const teamPerformanceData = [
    { name: "John D.", tasks: 28, rating: 4.9 },
    { name: "Sarah M.", tasks: 24, rating: 4.8 },
    { name: "Mike R.", tasks: 22, rating: 4.7 },
    { name: "Emma L.", tasks: 26, rating: 4.9 },
  ];

  const categoryData = [
    { category: "Cosmetics", count: 45 },
    { category: "Fashion", count: 38 },
    { category: "Food", count: 32 },
    { category: "Electronics", count: 28 },
    { category: "Home Decor", count: 25 },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Manager Dashboard</h1>
          <p className="text-gray-400">Monitor performance, revenue, and team metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Total Revenue</CardTitle>
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">$45,000</div>
              <p className="text-xs text-green-400 mt-1">+20% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Active Orders</CardTitle>
                <Package className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">35</div>
              <p className="text-xs text-green-400 mt-1">12 due this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Team Members</CardTitle>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">24</div>
              <p className="text-xs text-purple-400 mt-1">4 3D artists, 3 photographers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Completion Rate</CardTitle>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">94%</div>
              <p className="text-xs text-yellow-400 mt-1">On-time delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Settings className="w-4 h-4 mr-2" />
              Catalog
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trend</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly revenue over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order Status Pie Chart */}
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Order Status Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Current order breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Performance */}
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Category Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Number of orders by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="category" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Order Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Assign tasks and monitor progress
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    View All Orders
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: "ORD-001", title: "Luxury Perfume AR", team: "Team A", status: "In Progress" },
                    { id: "ORD-002", title: "Fashion Collection", team: "Team B", status: "Pending" },
                    { id: "ORD-003", title: "Food Menu 3D", team: "Team A", status: "Completed" },
                  ].map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/20"
                    >
                      <div>
                        <p className="text-white font-medium">{order.title}</p>
                        <p className="text-sm text-gray-400">{order.id} • {order.team}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-cyan-400">{order.status}</span>
                        <Button size="sm" variant="outline" className="border-blue-500/50">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Team Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Individual team member metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                    />
                    <Legend />
                    <Bar dataKey="tasks" fill="#06b6d4" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Catalog Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Add, edit, and manage content catalog
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    Add New Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start border-blue-500/50">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Categories & Pricing
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-blue-500/50">
                    <Package className="w-4 h-4 mr-2" />
                    Manage Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reports */}
        <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur mt-6">
          <CardHeader>
            <CardTitle className="text-white">Export Reports</CardTitle>
            <CardDescription className="text-gray-400">
              Download detailed analytics and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-blue-500/50">
                <Download className="w-4 h-4 mr-2" />
                Revenue Report (PDF)
              </Button>
              <Button variant="outline" className="border-blue-500/50">
                <Download className="w-4 h-4 mr-2" />
                Team Performance (CSV)
              </Button>
              <Button variant="outline" className="border-blue-500/50">
                <Download className="w-4 h-4 mr-2" />
                Order Summary (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
