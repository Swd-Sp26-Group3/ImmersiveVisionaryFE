"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Edit, Loader2, Save, X, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { UserProfile } from "./types";

interface ProfileTabProps {
  profile: UserProfile | null;
  loading: boolean;
  onProfileUpdated: (updated: UserProfile) => void;
}

interface EditForm {
  UserName: string;
  Email: string;
  Phone: string;
}

export function ProfileTab({ profile, loading, onProfileUpdated }: ProfileTabProps) {
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [form, setForm]             = useState<EditForm>({ UserName: "", Email: "", Phone: "" });

  const handleStartEdit = () => {
    if (!profile) return;
    setForm({ UserName: profile.UserName, Email: profile.Email, Phone: profile.Phone ?? "" });
    setSuccessMsg("");
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg("");
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await apiFetch("/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserName: form.UserName || undefined,
          Email:    form.Email    || undefined,
          Phone:    form.Phone    || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message ?? "Cập nhật thất bại.");
        return;
      }

      onProfileUpdated(data.data ?? data);
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
    } catch {
      setErrorMsg("Connection error, please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
        <CardContent className="p-6 flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading...
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
        <CardContent className="p-6">
          <p className="text-gray-400">Could not load profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Account Profile</CardTitle>
            <CardDescription className="text-gray-400">Your account details from the system</CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Feedback messages */}
        {successMsg && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-600/15 border border-green-500/30 text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        {/* VIEW MODE */}
        {!isEditing && (
          <div className="space-y-0 text-sm">
            {[
              { label: "User ID",      value: `#${profile.UserId}`,                              editable: false },
              { label: "Username",     value: profile.UserName,                                   editable: true  },
              { label: "Email",        value: profile.Email,                                      editable: true  },
              { label: "Phone",        value: profile.Phone ?? "Not set",                        editable: true  },
              { label: "Role",         value: profile.RoleName,                                   editable: false },
              { label: "Company",      value: profile.CompanyName ?? "Not assigned",              editable: false },
              { label: "Member since", value: new Date(profile.CreatedAt).toLocaleDateString(),   editable: false },
            ].map(({ label, value, editable }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${editable ? "text-white" : "text-slate-500"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {[
                { key: "UserName", label: "Username",     type: "text",  placeholder: "Enter username"     },
                { key: "Email",    label: "Email",         type: "email", placeholder: "Enter email"        },
                { key: "Phone",    label: "Phone",         type: "text",  placeholder: "Enter phone number" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
                  <Input
                    type={type}
                    value={form[key as keyof EditForm]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              {/* Read-only fields */}
              <div className="pt-2 space-y-2.5 text-sm border-t border-slate-700/50">
                {[
                  { label: "Role",         value: profile.RoleName },
                  { label: "Company",      value: profile.CompanyName ?? "Not assigned" },
                  { label: "Member since", value: new Date(profile.CreatedAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-slate-500">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  : <><Save className="w-4 h-4 mr-2" />Save Changes</>
                }
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}