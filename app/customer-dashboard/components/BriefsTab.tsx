"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function BriefsTab() {
  return (
    <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Create New Brief</CardTitle>
        <CardDescription className="text-gray-400">Start a custom 3D/AR content order</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/order">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
            <Plus className="w-4 h-4 mr-2" /> Create Brief
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}