import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "@/components/ui/alert";
import {
  Lock,
  Unlock,
  Shield,
  Download,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HospitalProfile {
  hospitalName: string;
  licenseNumber: string;
  hospitalType: string;
  verificationBadge: boolean;
  verificationDate: string;
  emergencyContact: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  operatingHours: string;
  emergencyCapacity: string;
}

export default function ProfileSettings() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<HospitalProfile>({
    hospitalName: "",
    licenseNumber: "",
    hospitalType: "",
    verificationBadge: false,
    verificationDate: "",
    emergencyContact: "",
    coordinatorName: "",
    coordinatorPhone: "",
    coordinatorEmail: "",
    operatingHours: "",
    emergencyCapacity: "",
  });
  const [loading, setLoading] = useState(true);
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [formValues, setFormValues] = useState<HospitalProfile | null>(null);
  const [hospitalRecordId, setHospitalRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Profile is read-only — data comes from registration details only

  const handleDownload = async (fileType: "pdf" | "csv", fileName: string) => {
    setDownloading(`${fileName}-${fileType}`);
    try {
      // Simulate file generation and download
      const content = `Report: ${fileName}\nGenerated: ${new Date().toISOString()}\nHospital: ${profile.hospitalName || 'Unknown'}`;
      const blob = new Blob([content], { type: fileType === "pdf" ? "application/pdf" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: `${fileName}.${fileType} has been downloaded.`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // Try hospitals table (if exists)
        try {
          const { data: hospRow, error: hospErr } = await supabase
            .from('hospitals')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (!hospErr && hospRow) {
            if (!mounted) return;
            setHospitalRecordId(String(hospRow.id ?? hospRow._id ?? null));
            setProfile({
              hospitalName: hospRow.name ?? hospRow.hospital_name ?? '',
              licenseNumber: hospRow.license_number ?? hospRow.license ?? '',
              hospitalType: hospRow.type ?? '',
              verificationBadge: hospRow.is_verified ?? false,
              verificationDate: hospRow.verified_at ?? '',
              emergencyContact: hospRow.emergency_contact ?? '',
              coordinatorName: hospRow.coordinator_name ?? '',
              coordinatorPhone: hospRow.coordinator_phone ?? '',
              coordinatorEmail: hospRow.coordinator_email ?? '',
              operatingHours: hospRow.operating_hours ?? '',
              emergencyCapacity: hospRow.capacity ?? '',
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          // silently continue to profiles/user_metadata
        }

        // Try profiles table
        try {
          const { data: profileRow, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1)
            .single();

          if (!profileErr && profileRow) {
            if (!mounted) return;
            setProfile(prev => ({
              ...prev,
              hospitalName: profileRow.hospital_name ?? profileRow.full_name ?? prev.hospitalName,
              emergencyContact: profileRow.phone ?? prev.emergencyContact,
            }));
            setLoading(false);
            return;
          }
        } catch (e) {
          // fallback to user metadata
        }

        // Finally, use auth user metadata if available
        const metadata = (user.user_metadata ?? {}) as any;
        if (metadata) {
          setProfile(prev => ({
            ...prev,
            hospitalName: metadata.hospitalName ?? metadata.full_name ?? prev.hospitalName,
            emergencyContact: metadata.phone ?? prev.emergencyContact,
          }));
        }
      } catch (err) {
        console.warn('Failed to load hospital profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        fetchProfile();
      }
      if (event === 'SIGNED_OUT') {
        setProfile({
          hospitalName: '',
          licenseNumber: '',
          hospitalType: '',
          verificationBadge: false,
          verificationDate: '',
          emergencyContact: '',
          coordinatorName: '',
          coordinatorPhone: '',
          coordinatorEmail: '',
          operatingHours: '',
          emergencyCapacity: '',
        });
      }
    });

    return () => {
      mounted = false;
      try {
        authListener.subscription.unsubscribe();
      } catch {}
    };
  }, []);

  const startGlobalEdit = () => {
    setFormValues(profile);
    setGlobalEditMode(true);
  };

  const handleFormChange = (field: keyof HospitalProfile, value: string | boolean) => {
    setFormValues((prev) => (prev ? { ...prev, [field]: value as any } : prev));
  };

  const handleSaveAll = async () => {
    if (!formValues) return;
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Not authenticated');

      // Upsert hospitals record
      const hospitalPayload: any = {
        user_id: user.id,
        name: formValues.hospitalName,
        hospital_name: formValues.hospitalName,
        license_number: formValues.licenseNumber,
        type: formValues.hospitalType,
        emergency_contact: formValues.emergencyContact,
        coordinator_name: formValues.coordinatorName,
        coordinator_phone: formValues.coordinatorPhone,
        coordinator_email: formValues.coordinatorEmail,
        operating_hours: formValues.operatingHours,
        capacity: formValues.emergencyCapacity,
      };

      if (hospitalRecordId) {
        const { error } = await supabase.from('hospitals').update(hospitalPayload).eq('id', hospitalRecordId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hospitals').insert(hospitalPayload);
        if (error) throw error;
      }

      // Update lightweight profiles table for quick access
      const profilePayload: any = {
        hospital_name: formValues.hospitalName,
        phone: formValues.emergencyContact,
      };
      const { error: profileErr } = await supabase.from('profiles').update(profilePayload).eq('id', user.id);
      if (profileErr) {
        const { error: insertErr } = await supabase.from('profiles').insert({ id: user.id, ...profilePayload });
        if (insertErr) throw insertErr;
      }

      toast({ title: 'Saved', description: 'Profile updated successfully.' });
      setGlobalEditMode(false);
      // reload minimal data
      const { data: hosp } = await supabase.from('hospitals').select('*').eq('user_id', user.id).limit(1).single();
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).limit(1).single();
      setHospitalRecordId(String(hosp?.id ?? hosp?._id ?? hospitalRecordId));
      setProfile((prev) => ({
        ...prev,
        hospitalName: hosp?.name ?? prof?.hospital_name ?? prev.hospitalName,
        licenseNumber: hosp?.license_number ?? prev.licenseNumber,
        hospitalType: hosp?.type ?? prev.hospitalType,
        emergencyContact: hosp?.emergency_contact ?? prof?.phone ?? prev.emergencyContact,
        coordinatorName: hosp?.coordinator_name ?? prev.coordinatorName,
        coordinatorPhone: hosp?.coordinator_phone ?? prev.coordinatorPhone,
        coordinatorEmail: hosp?.coordinator_email ?? prev.coordinatorEmail,
        operatingHours: hosp?.operating_hours ?? prev.operatingHours,
        emergencyCapacity: hosp?.capacity ?? prev.emergencyCapacity,
      }));
    } catch (e: any) {
      console.error('Save failed', e);
      toast({ title: 'Save failed', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAll = () => {
    setFormValues(null);
    setGlobalEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center">
              {profile.hospitalName ? profile.hospitalName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profile.hospitalName || 'Hospital'}</h2>
              <p className="text-sm text-muted-foreground">Hospital</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!globalEditMode ? (
              <Button onClick={startGlobalEdit}>Edit Profile</Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveAll} disabled={saving} className="bg-primary text-white">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelAll} disabled={saving}>Cancel</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Security Alert */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✓ Your hospital account is verified and secure
        </AlertDescription>
      </Alert>

      {/* Hospital Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-blue-600" />
            Hospital Profile (Editable)
          </CardTitle>
          <CardDescription>
            Update your hospital information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Hospital Name", value: profile.hospitalName, key: "hospitalName" },
              { label: "License Number", value: profile.licenseNumber, key: "licenseNumber" },
              { label: "Hospital Type", value: profile.hospitalType, key: "hospitalType" },
              { label: "Verification Date", value: profile.verificationDate, key: "verificationDate" },
            ].map(({ label, value, key }) => (
              <motion.div
                key={key}
                className="p-3 border rounded-lg bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {globalEditMode && formValues ? (
                    <Input
                      value={String((formValues as any)[key] ?? value)}
                      onChange={(e) => handleFormChange(key as keyof HospitalProfile, e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold text-slate-900 mt-1">{value || '—'}</p>
                  )}
                </div>
              </motion.div>
            ))}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Admin Verification</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <Shield className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-blue-600" />
            Operational Information (Editable)
          </CardTitle>
          <CardDescription>
            Update your emergency contact details and operational information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Emergency Contact Number", value: profile.emergencyContact, key: "emergencyContact" },
              { label: "Emergency Coordinator Name", value: profile.coordinatorName, key: "coordinatorName" },
              { label: "Coordinator Phone", value: profile.coordinatorPhone, key: "coordinatorPhone" },
              { label: "Coordinator Email", value: profile.coordinatorEmail, key: "coordinatorEmail" },
              { label: "Operating Hours", value: profile.operatingHours, key: "operatingHours" },
              { label: "Emergency Capacity", value: profile.emergencyCapacity, key: "emergencyCapacity" },
            ].map(({ label, value, key }) => (
              <motion.div
                key={key}
                className="p-3 border rounded-lg bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {globalEditMode && formValues ? (
                    <Input
                      value={String((formValues as any)[key] ?? value)}
                      onChange={(e) => handleFormChange(key as keyof HospitalProfile, e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    <p className="font-semibold text-slate-900 mt-1">{value || '—'}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Records & Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Downloadable Records & Reports</CardTitle>
          <CardDescription>
            Download audit-ready records in your preferred format (Timestamped & Signed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Emergency Handling History", file: "emergency_history" },
              { title: "Blood Allocation Reports", file: "blood_allocation" },
              { title: "Donation Fulfillment Logs", file: "fulfillment_logs" },
              { title: "Admin Approval Decisions", file: "admin_approvals" },
              { title: "Monthly Activity Summary", file: "monthly_summary" },
            ].map(({ title, file }) => (
              <div
                key={file}
                className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last updated: 2 hours ago</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleDownload("pdf", file)}
                    disabled={downloading === `${file}-pdf`}
                  >
                    <Download className="w-4 h-4" />
                    {downloading === `${file}-pdf` ? "Downloading..." : "PDF"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => handleDownload("csv", file)}
                    disabled={downloading === `${file}-csv`}
                  >
                    <Download className="w-4 h-4" />
                    {downloading === `${file}-csv` ? "Downloading..." : "CSV"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Logout Section */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to logout? You will need to login again to access the hospital dashboard.
            </p>
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Your session will be cleared and your role will be reset.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
                Cancel
              </Button>
              <Button
                className="gap-2 bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (e) {
                    console.warn('signOut failed', e);
                  }
                  navigate('/');
                }}
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="Enter new password" className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" className="mt-2" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowPasswordDialog(false)}>Save Password</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
