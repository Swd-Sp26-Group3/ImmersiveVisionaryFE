"use client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Download } from "lucide-react";
import { MOCK_PURCHASES } from "./types";

export function PurchasesTab() {
  return (
    <div className="space-y-4">
      {MOCK_PURCHASES.map((purchase) => (
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
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}