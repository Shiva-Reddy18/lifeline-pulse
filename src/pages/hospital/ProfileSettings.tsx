// src/pages/hospital/ProfileSettings.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Lock,
  Shield,
  Download,
  LogOut,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  User,
  Phone,
  Mail,
  Clock, // ✅ ADD THIS
} from "lucide-react";

import { format } from "date-fns";

/**
 * ProfileSettings.tsx
 *
 * Improvements over the original:
 * - Reads hospital profile from Supabase (hospitals table) scoped by hospital UUID (profile.id).
 * - Allows editing fields and persists updates to Supabase with optimistic updates and toast feedback.
 * - Keeps demo-friendly fallbacks when DB/tables aren't available.
 * - Uses AuthContext derived profile but does NOT rely on user.id for hospital identity.
 * - Adds CSV/PDF-like download simulation and proper feedback.
 * - Provides logout confirmation and optional password change dialog (UI-only; not sending passwords).
 *
 * NOTE:
 * - This is defensive code: it will show demo data if Supabase or expected tables are missing.
 * - Field names mapped to a simple hospital schema: hospitals (id, name, license_number, type, verification_status, verified_at, emergency_contact, coordinator_name, coordinator_phone, coordinator_email, operating_hours, emergency_capacity).
 */

/* -------------------------
   Types
   ------------------------- */
type UUID = string;

type HospitalProfileRow = {
  id: UUID;
  hospital_name?: string | null;
  license_number?: string | null;
  hospital_type?: string | null;
  verification_status?: "VERIFIED" | "PENDING" | "REJECTED" | null;
  verified_at?: string | null;
  emergency_contact?: string | null;
  coordinator_name?: string | null;
  coordinator_phone?: string | null;
  coordinator_email?: string | null;
  operating_hours?: string | null;
  emergency_capacity?: string | null;
  updated_at?: string | null;
};

/* -------------------------
   Component
   ------------------------- */
export default function ProfileSettings({ hospitalId: propHospitalId }: { hospitalId?: UUID }) {
  const { profile: authProfile, logout } = useAuth() as any;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Prefer explicit prop hospitalId (passed from parent). Otherwise derive from auth profile.
  const derivedHospitalId: UUID | undefined =
    propHospitalId ?? authProfile?.id ?? (authProfile as any)?.hospital_id;

  // UI state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Partial<HospitalProfileRow>>({});
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  /* -------------------------
     Fetch hospital profile (read-only query)
     ------------------------- */
  const fetchHospital = async (): Promise<HospitalProfileRow | null> => {
    if (!derivedHospitalId) return null;
    try {
      const { data, error } = await supabase
        .from("hospitals")
        .select(
          `id,
           hospital_name,
           license_number,
           hospital_type,
           verification_status,
           verified_at,
           emergency_contact,
           coordinator_name,
           coordinator_phone,
           coordinator_email,
           operating_hours,
           emergency_capacity,
           updated_at`
        )
        .eq("id", derivedHospitalId)
        .limit(1)
        .single();
      if (error) {
        // If table missing or permission denied, fallback to null and let UI show demo
        console.warn("fetchHospital error:", error);
        throw error;
      }
      return data as HospitalProfileRow;
    } catch (e) {
      console.warn("fetchHospital fallback - returning null (demo)", e);
      return null;
    }
  };

  const hospitalQuery = useQuery({
    queryKey: ["hospital", derivedHospitalId],
    queryFn: fetchHospital,
    enabled: !!derivedHospitalId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // Derived initial values: use DB row, otherwise fallback to authProfile or demo defaults
  const initialProfile = useMemo<HospitalProfileRow>(() => {
    const db = hospitalQuery.data;
    if (db) return db;
    // fallback merge from auth profile or demo
    return {
      id: derivedHospitalId ?? "local-demo",
      hospital_name: authProfile?.hospital_name ?? authProfile?.full_name ?? "City Central Hospital (Demo)",
      license_number: authProfile?.license_number ?? "HOS-DEMO-0001",
      hospital_type: authProfile?.hospital_type ?? "Private",
      verification_status: authProfile?.verification_status ?? "VERIFIED",
      verified_at: authProfile?.verified_at ?? new Date().toISOString(),
      emergency_contact: authProfile?.emergency_contact ?? "+91-99999-00000",
      coordinator_name: authProfile?.coordinator_name ?? "Dr. Demo Coordinator",
      coordinator_phone: authProfile?.coordinator_phone ?? "+91-99999-00001",
      coordinator_email: authProfile?.coordinator_email ?? "coord@demo.hospital",
      operating_hours: authProfile?.operating_hours ?? "24/7",
      emergency_capacity: authProfile?.emergency_capacity ?? "50 beds, 10 ICU",
      updated_at: authProfile?.updated_at ?? new Date().toISOString(),
    };
  }, [hospitalQuery.data, authProfile, derivedHospitalId]);

  useEffect(() => {
    // whenever fetched data changes, seed form values
    setFormValues({
      hospital_name: initialProfile.hospital_name ?? undefined,
      license_number: initialProfile.license_number ?? undefined,
      hospital_type: initialProfile.hospital_type ?? undefined,
      emergency_contact: initialProfile.emergency_contact ?? undefined,
      coordinator_name: initialProfile.coordinator_name ?? undefined,
      coordinator_phone: initialProfile.coordinator_phone ?? undefined,
      coordinator_email: initialProfile.coordinator_email ?? undefined,
      operating_hours: initialProfile.operating_hours ?? undefined,
      emergency_capacity: initialProfile.emergency_capacity ?? undefined,
    });
  }, [initialProfile]);

  /* -------------------------
     Update mutation (upserts into hospitals table)
     ------------------------- */
  const updateMutation = useMutation(
    async (payload: Partial<HospitalProfileRow>) => {
      if (!derivedHospitalId) throw new Error("Hospital ID missing; cannot save to DB (demo mode)");
      const updatePayload: Partial<HospitalProfileRow> = {
        id: derivedHospitalId,
        ...payload,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("hospitals").upsert(updatePayload, { onConflict: ["id"] }).select().single();
      if (error) throw error;
      return data as HospitalProfileRow;
    },
    {
      onMutate: async (vars) => {
        // optimistic UI update: set form values (already set) and show saving toast
        toast?.({ title: "Saving", description: "Updating hospital profile..." });
      },
      onSuccess: (data) => {
        queryClient.setQueryData(["hospital", derivedHospitalId], data);
        toast?.({ title: "Saved", description: "Hospital profile updated successfully." });
        setEditingField(null);
      },
      onError: (err: any) => {
        console.error("update error", err);
        toast?.({ title: "Save failed", description: err?.message ?? "Unable to save changes", variant: "destructive" });
      },
    }
  );

  /* -------------------------
     Handlers
     ------------------------- */
  const startEdit = (field: keyof HospitalProfileRow) => {
    setEditingField(String(field));
    setFormValues((prev) => ({ ...prev, [field]: prev[field as keyof typeof prev] ?? initialProfile[field as keyof HospitalProfileRow] }));
  };

  const cancelEdit = () => {
    // reset to current canonical values
    setFormValues({
      hospital_name: initialProfile.hospital_name ?? undefined,
      license_number: initialProfile.license_number ?? undefined,
      hospital_type: initialProfile.hospital_type ?? undefined,
      emergency_contact: initialProfile.emergency_contact ?? undefined,
      coordinator_name: initialProfile.coordinator_name ?? undefined,
      coordinator_phone: initialProfile.coordinator_phone ?? undefined,
      coordinator_email: initialProfile.coordinator_email ?? undefined,
      operating_hours: initialProfile.operating_hours ?? undefined,
      emergency_capacity: initialProfile.emergency_capacity ?? undefined,
    });
    setEditingField(null);
  };

  const saveField = async (field: keyof HospitalProfileRow) => {
    const payload: Partial<HospitalProfileRow> = { [field]: formValues[field] } as any;
    try {
      await updateMutation.mutateAsync(payload);
    } catch {
      // handled by mutation
    }
  };

  const handleDownload = async (fileType: "pdf" | "csv", fileName: string) => {
    setDownloading(`${fileName}-${fileType}`);
    try {
      // create a small audit-style file (demo)
      const content = [
        `Report: ${fileName}`,
        `Generated: ${new Date().toISOString()}`,
        `Hospital: ${initialProfile.hospital_name}`,
        `Hospital ID: ${initialProfile.id}`,
        "",
        "This is a demo export. For full audit logs, check the admin console or the 'History & Records' page.",
      ].join("\n");
      const blob = new Blob([content], { type: fileType === "pdf" ? "application/pdf" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast?.({ title: "Downloaded", description: `${fileName}.${fileType} has been downloaded.` });
    } catch (e) {
      console.error("download error", e);
      toast?.({ title: "Error", description: "Failed to download file.", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } catch (e) {
      console.warn("logout failed", e);
    } finally {
      // safe redirect for demo
      window.location.href = "/";
    }
  };

  /* -------------------------
     Render helpers
     ------------------------- */
  const verificationBadge = useMemo(() => {
    const v = initialProfile.verification_status;
    if (!v) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    if (v === "VERIFIED") return <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>;
    if (v === "PENDING") return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
  }, [initialProfile.verification_status]);

  /* -------------------------
     UI
     ------------------------- */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Profile & Settings</h2>

      {/* Security Alert */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 ml-2">✓ Your hospital account is secure — verification status shown below</AlertDescription>
      </Alert>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Hospital Profile
            <div className="ml-auto">{verificationBadge}</div>
          </CardTitle>
          <CardDescription>
            Manage the hospital information that appears to donors, volunteers and admins.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Hospital Name", key: "hospital_name", icon: User },
              { label: "License Number", key: "license_number", icon: Lock },
              { label: "Hospital Type", key: "hospital_type", icon: Shield },
              { label: "Verification Date", key: "verified_at", icon: CheckCircle },
            ].map(({ label, key }) => {
              const k = key as keyof HospitalProfileRow;
              const editing = editingField === key;
              const current = (formValues[k] ?? (initialProfile as any)[k]) ?? "";
              return (
                <motion.div key={key} className="p-3 border rounded-lg hover:border-blue-300 transition-colors">
                  {editing ? (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">{label}</label>
                      <Input
                        value={String(current ?? "")}
                        onChange={(e) => setFormValues((p) => ({ ...p, [k]: e.target.value }))}
                        className="w-full"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => saveField(k)}>
                          <Save className="w-4 h-4" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="font-semibold text-slate-900 mt-1">{String(current ?? "—")}</p>
                        {key === "verified_at" && (
                          <p className="text-xs text-slate-500 mt-1">Verified: {initialProfile.verified_at ? format(new Date(initialProfile.verified_at), "yyyy-MM-dd") : "—"}</p>
                        )}
                      </div>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => startEdit(k)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Admin Verification</p>
                <p className="text-sm mt-1">Recorded by system admin. Use audit reports for details.</p>
              </div>
              <div>{verificationBadge}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Operational Info */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Information</CardTitle>
          <CardDescription>Emergency contact, coordinator and capacity.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Emergency Contact", key: "emergency_contact", icon: Phone },
              { label: "Coordinator Name", key: "coordinator_name", icon: User },
              { label: "Coordinator Phone", key: "coordinator_phone", icon: Phone },
              { label: "Coordinator Email", key: "coordinator_email", icon: Mail },
              { label: "Operating Hours", key: "operating_hours", icon: Clock },
              { label: "Emergency Capacity", key: "emergency_capacity", icon: User },
            ].map(({ label, key }) => {
              const k = key as keyof HospitalProfileRow;
              const editing = editingField === key;
              const current = (formValues[k] ?? (initialProfile as any)[k]) ?? "";
              return (
                <motion.div key={key} className="p-3 border rounded-lg hover:border-blue-300 transition-colors">
                  {editing ? (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">{label}</label>
                      <Input
                        value={String(current ?? "")}
                        onChange={(e) => setFormValues((p) => ({ ...p, [k]: e.target.value }))}
                        className="w-full"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => saveField(k)}>
                          <Save className="w-4 h-4" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="font-semibold text-slate-900 mt-1">{String(current ?? "—")}</p>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => startEdit(k)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Downloadable Records & Reports</CardTitle>
          <CardDescription>Audit-ready exports (demo). For signed official exports use the admin console.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Emergency Handling History", file: "emergency_history" },
              { title: "Blood Allocation Reports", file: "blood_allocation" },
              { title: "Donation Fulfillment Logs", file: "fulfillment_logs" },
              { title: "Monthly Activity Summary", file: "monthly_summary" },
            ].map(({ title, file }) => (
              <div key={file} className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 transition-colors">
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last generated: {initialProfile.updated_at ? format(new Date(initialProfile.updated_at), "yyyy-MM-dd HH:mm") : "—"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload("pdf", file)} disabled={downloading === `${file}-pdf`}>
                    <Download className="w-4 h-4" /> {downloading === `${file}-pdf` ? "Downloading..." : "PDF"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload("csv", file)} disabled={downloading === `${file}-csv`}>
                    <Download className="w-4 h-4" /> {downloading === `${file}-csv` ? "Downloading..." : "CSV"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account actions */}
      <div className="flex gap-3">
        <Button className="flex-1" variant="outline" onClick={() => setShowPasswordDialog(true)}>
          <Lock className="w-4 h-4 mr-2" /> Change Password
        </Button>

        <Button className="flex-1" variant="destructive" onClick={() => setShowLogoutDialog(true)}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Are you sure you want to log out? Your session will end and you'll return to the login screen.</p>
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 ml-2">If you are using a shared device, make sure to sign out completely.</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleLogout}><LogOut className="w-4 h-4" /> Logout</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog (UI-only; real password change should use Auth provider endpoints) */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Current Password</label>
              <div className="relative mt-2">
                <Input type={showPassword ? "text" : "password"} placeholder="Current password" className="pr-10" />
                <button onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-2.5">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">New Password</label>
              <Input type="password" placeholder="New password" className="mt-2" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" className="mt-2" />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button onClick={() => { setShowPasswordDialog(false); toast?.({ title: "Saved", description: "Password updated (UI-only demo). Use auth provider for real changes." }); }}>Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
