"use client";
import { Card, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Download, Edit, Eye, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { MOCK_ORDERS, getStatusColor } from "./types";

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "Completed")     return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "In 3D Modeling") return <Clock className="w-4 h-4 text-blue-400" />;
  return <AlertCircle className="w-4 h-4 text-yellow-400" />;
};

export function OrdersTab() {
  return (
    <div className="space-y-4">
      {MOCK_ORDERS.map((order) => (
        <Card key={order.id} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-blue-500/20">
                  <img src={order.thumbnail} alt={order.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <CardTitle className="text-white mb-2">{order.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <StatusIcon status={order.status} />
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <span className="text-sm text-gray-400">• {order.id}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>Progress:</span>
                      <div className="w-32">
                        <Progress value={order.progress} className="h-2" />
                      </div>
                      <span>{order.progress}%</span>
                    </div>
                    <p className="text-sm text-gray-400">Started: {order.date}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-blue-500/50 text-slate-300">
                  <Edit className="w-4 h-4 mr-1" /> Edit Brief
                </Button>
                {order.status === "Completed" ? (
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="border-cyan-500/50 text-slate-300">
                    <Eye className="w-4 h-4 mr-1" /> Preview
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-cyan-500/50 text-slate-300">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}