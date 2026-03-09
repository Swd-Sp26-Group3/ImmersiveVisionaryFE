'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Palette, Upload, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ArtistDashboard() {
  const tasks = [
    {
      id: "TASK-001",
      orderId: "ORD-001",
      title: "Luxury Perfume AR Campaign",
      customer: "Beauty Brands Inc.",
      deadline: "2026-03-05",
      status: "In Progress",
      stage: "3D Modeling",
      priority: "High",
      thumbnail: "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=400",
    },
    {
      id: "TASK-002",
      orderId: "ORD-002",
      title: "Fashion Collection Showcase",
      customer: "Elite Fashion Co.",
      deadline: "2026-03-08",
      status: "Pending",
      stage: "Photo Shoot",
      priority: "Medium",
      thumbnail: "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=400",
    },
    {
      id: "TASK-003",
      orderId: "ORD-004",
      title: "Smart Watch AR Demo",
      customer: "Tech Innovations",
      deadline: "2026-03-03",
      status: "In Progress",
      stage: "AR Integration",
      priority: "High",
      thumbnail: "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=400",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-600";
      case "Medium":
        return "bg-yellow-600";
      default:
        return "bg-green-600";
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Artist Dashboard</h1>
          <p className="text-gray-400">Manage 3D/AR content production tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">5</div>
              <p className="text-xs text-blue-400 mt-1">2 high priority</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Completed This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">8</div>
              <p className="text-xs text-green-400 mt-1">+3 from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">3</div>
              <p className="text-xs text-yellow-400 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400">Avg. Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">4.5</div>
              <p className="text-xs text-gray-400 mt-1">Days</p>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Task Queue</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and update production tasks
                </CardDescription>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-blue-500/30">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="photo">Photo Shoot</SelectItem>
                  <SelectItem value="3d">3D Modeling</SelectItem>
                  <SelectItem value="ar">AR Integration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg bg-slate-900/50 border border-blue-500/20 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={task.thumbnail}
                      alt={task.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Task Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-400">
                          {task.customer} • Order {task.orderId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          <Badge variant="outline" className="border-blue-500/50 text-cyan-400">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Stage:</span>
                        <span className="text-white">{task.stage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white">{task.deadline}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select defaultValue={task.status.toLowerCase().replace(" ", "-")}>
                        <SelectTrigger className="w-[180px] bg-slate-800/50 border-blue-500/30 text-white">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Ready for Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" className="border-blue-500/50">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Preview
                      </Button>
                      <Button size="sm" variant="outline" className="border-cyan-500/50">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">My Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tasks Completed (This Month)</span>
                <span className="text-white font-bold">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Rating</span>
                <span className="text-white font-bold">4.8/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">On-Time Delivery</span>
                <span className="text-green-400 font-bold">95%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Completed Work
              </Button>
              <Button variant="outline" className="w-full border-blue-500/50">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
