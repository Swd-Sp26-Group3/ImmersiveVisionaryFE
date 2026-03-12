"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { UserProfile } from "./types";

interface ProfileTabProps {
  profile: UserProfile | null;
  loading: boolean;
}

export function ProfileTab({ profile, loading }: ProfileTabProps) {
  return (
    <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Account Profile</CardTitle>
        <CardDescription className="text-gray-400">Your account details from the system</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading...
          </div>
        ) : profile ? (
          <div className="space-y-3 text-sm">
            {[
              { label: "User ID",      value: `#${profile.UserId}` },
              { label: "Username",     value: profile.UserName },
              { label: "Email",        value: profile.Email },
              { label: "Phone",        value: profile.Phone ?? "Not set" },
              { label: "Role",         value: profile.RoleName },
              { label: "Company",      value: profile.CompanyName ?? "Not assigned" },
              { label: "Member since", value: new Date(profile.CreatedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between py-2 border-b border-slate-700/50 last:border-0"
              >
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
            <div className="pt-4">
              <Button variant="outline" className="border-blue-500/50 text-slate-300">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Could not load profile.</p>
        )}
      </CardContent>
    </Card>
  );
}