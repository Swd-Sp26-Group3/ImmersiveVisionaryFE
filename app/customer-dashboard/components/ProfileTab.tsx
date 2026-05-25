"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { InfoGrid } from "@/app/components/ui/info-grid";
import { Edit, Save, X, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { UserProfile } from "./types";
import { toast } from "sonner";

interface ProfileTabProps {
  profile: UserProfile | null;
  loading: boolean;
  onProfileUpdated: (updated: UserProfile) => void;
}

interface EditForm {
  UserName: string;
  Email: string;
  Phone: string;
  CompanyId: number | null;
}

interface Company {
  CompanyId: number;
  CompanyName: string;
}

const EDITABLE_FIELDS = [
  { key: "UserName", label: "Username",     type: "text",  placeholder: "Enter username"     },
  { key: "Email",    label: "Email",         type: "email", placeholder: "Enter email"         },
  { key: "Phone",    label: "Phone",         type: "text",  placeholder: "Enter phone number"  },
] as const;

export function ProfileTab({ profile, loading, onProfileUpdated }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<EditForm>({ UserName: "", Email: "", Phone: "", CompanyId: null });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await apiFetch("/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.data ?? data);
        } else if (res.status === 403) {
          setCompanies([]);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleStartEdit = () => {
    if (!profile) return;
    setForm({
      UserName: profile.UserName,
      Email: profile.Email,
      Phone: profile.Phone ?? "",
      CompanyId: profile.CompanyId,
    });
    setSuccessMsg("");
    setErrorMsg("");
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setErrorMsg(""); };

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
          UserName:  form.UserName  || undefined,
          Email:     form.Email     || undefined,
          Phone:     form.Phone     || undefined,
          CompanyId: form.CompanyId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.message ?? "Update failed."); return; }
      onProfileUpdated(data.data ?? data);
      setSuccessMsg("Profile updated successfully!");
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch {
      setErrorMsg("Connection error, please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
        <CardContent className="p-6">
          <LoadingSpinner size="sm" color="cyan" /> <span className="text-gray-400 ml-2">Loading...</span>
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

  const viewItems = [
    { label: "Username",     value: profile.UserName },
    { label: "Email",        value: profile.Email },
    { label: "Phone",        value: profile.Phone ?? "Not set" },
    { label: "Role",         value: profile.RoleName },
    { label: "Company",      value: profile.CompanyName ?? "Not assigned" },
    { label: "Member since", value: new Date(profile.CreatedAt).toLocaleDateString() },
  ];

  const readOnlyItems = [
    { label: "Role",         value: profile.RoleName },
    { label: "Company",      value: profile.CompanyName ?? "Not assigned" },
    { label: "Member since", value: new Date(profile.CreatedAt).toLocaleDateString() },
  ];

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
        {/* Feedback */}
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
            {viewItems.map(({ label, value }, idx) => (
              <div
                key={label}
                className={`flex justify-between items-center py-2.5 ${idx < viewItems.length - 1 ? "border-b border-slate-700/50" : ""}`}
              >
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${idx < 3 ? "text-white" : "text-slate-500"}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditing && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {EDITABLE_FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
                  <Input
                    type={type}
                    value={(form[key as keyof EditForm] as string) ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              {/* Company Select (shadcn) */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Assign Company</label>
                {loadingCompanies ? (
                  <p className="text-[10px] text-slate-500 italic">Loading companies...</p>
                ) : (
                  <Select
                    value={form.CompanyId?.toString() ?? ""}
                    onValueChange={(v) => setForm((f) => ({ ...f, CompanyId: v ? Number(v) : null }))}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-purple-500">
                      <SelectValue placeholder="Select a company..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      {companies.map((c) => (
                        <SelectItem key={c.CompanyId} value={c.CompanyId.toString()} className="text-white hover:bg-slate-700">
                          {c.CompanyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Read-only fields */}
              <div className="pt-2 border-t border-slate-700/50">
                <InfoGrid
                  items={readOnlyItems}
                  cols={3}
                  cellClassName="bg-slate-800/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                {saving
                  ? <><LoadingSpinner size="xs" color="white" className="mr-2" />Saving...</>
                  : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
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