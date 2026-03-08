"use client";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
      <div className="text-center flex flex-col items-center gap-6 max-w-md px-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold">Purchase Successful!</h1>
        <p className="text-slate-400">Your 3D/AR content is ready to download.</p>

        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8">
          <Download className="w-5 h-5 mr-2" />
          Download Now
        </Button>

        <Button
          variant="outline"
          className="border-slate-600"
          onClick={() => router.push("/customer-dashboard")}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
