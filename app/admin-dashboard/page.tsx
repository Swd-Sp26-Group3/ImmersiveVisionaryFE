'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Users, 
  Settings, 
  Shield, 
  FileText, 
  Search,
  Ban,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function AdminPanel() {
  const users = [
    {
      id: "USR-001",
      name: "John Doe",
      email: "john@example.com",
      role: "Customer",
      status: "Active",
      joined: "2026-01-15",
    },
    {
      id: "USR-002",
      name: "Sarah Miller",
      email: "sarah@example.com",
      role: "3D Artist",
      status: "Active",
      joined: "2026-01-10",
    },
    {
      id: "USR-003",
      name: "Mike Roberts",
      email: "mike@example.com",
      role: "Manager",
      status: "Active",
      joined: "2025-12-20",
    },
    {
      id: "USR-004",
      name: "Emma Wilson",
      email: "emma@example.com",
      role: "Customer",
      status: "Pending",
      joined: "2026-03-01",
    },
  ];

  const systemLogs = [
    {
      id: "LOG-001",
      type: "Info",
      message: "User USR-001 logged in successfully",
      timestamp: "2026-03-02 10:23:45",
    },
    {
      id: "LOG-002",
      type: "Warning",
      message: "High server load detected",
      timestamp: "2026-03-02 09:15:22",
    },
    {
      id: "LOG-003",
      type: "Error",
      message: "Failed upload attempt from USR-005",
      timestamp: "2026-03-02 08:45:10",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-600";
      case "Pending":
        return "bg-yellow-600";
      case "Suspended":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "Error":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "Warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Admin Panel</h1>
          <p className="text-gray-400">System administration and configuration</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400">Total Users</CardTitle>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">248</div>
              <p className="text-xs text-green-400 mt-1">+12 this week</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400">Active Sessions</CardTitle>
                <Shield className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">87</div>
              <p className="text-xs text-gray-400 mt-1">Currently online</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400">Storage Used</CardTitle>
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">2.4TB</div>
              <p className="text-xs text-yellow-400 mt-1">68% of capacity</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-400">System Health</CardTitle>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">98%</div>
              <p className="text-xs text-green-400 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="w-4 h-4 mr-2" />
              Content Moderation
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Shield className="w-4 h-4 mr-2" />
              System Logs
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Accounts</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage user accounts, roles, and permissions
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 bg-slate-900/50 border-blue-500/30 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/20 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-white font-medium">{user.name}</p>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <Badge variant="outline" className="border-blue-500/50 text-cyan-400">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          {user.email} • ID: {user.id} • Joined {user.joined}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-500/50">
                          Edit Role
                        </Button>
                        {user.status === "Active" && (
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                        {user.status === "Pending" && (
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Upload Configuration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure file upload limits and restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Max File Size (MB)</label>
                    <Input
                      type="number"
                      defaultValue="100"
                      className="bg-slate-900/50 border-blue-500/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Allowed File Types</label>
                    <Input
                      type="text"
                      defaultValue="GLB, USDZ, FBX, OBJ"
                      className="bg-slate-900/50 border-blue-500/30 text-white"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Notification Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure system notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-blue-500/30" />
                    Email notifications for new orders
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-blue-500/30" />
                    Alert on system errors
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input type="checkbox" className="rounded border-blue-500/30" />
                    Daily performance reports
                  </label>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 mt-4">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="content">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Content Review Queue</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and moderate user-uploaded content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No content pending moderation</p>
                  <Button variant="outline" className="border-blue-500/50">
                    View All Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">System Activity Logs</CardTitle>
                    <CardDescription className="text-gray-400">
                      Monitor system events and errors
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="border-blue-500/50">
                    Export Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-blue-500/10"
                    >
                      {getLogIcon(log.type)}
                      <div className="flex-1">
                        <p className="text-white text-sm">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          log.type === "Error"
                            ? "border-red-500/50 text-red-400"
                            : log.type === "Warning"
                            ? "border-yellow-500/50 text-yellow-400"
                            : "border-blue-500/50 text-blue-400"
                        }`}
                      >
                        {log.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Link href="/dashboard/customer">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-white text-sm">View as Customer</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/operations">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-white text-sm">View as Operations</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/manager">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 backdrop-blur hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-white text-sm">View as Manager</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
