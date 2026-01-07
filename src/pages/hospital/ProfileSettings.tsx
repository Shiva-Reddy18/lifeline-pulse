import React, { useState } from "react";
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
  const [profile, setProfile] = useState<HospitalProfile>({
    hospitalName: "City Central Hospital",
    licenseNumber: "HOS-2024-12345",
    hospitalType: "Government",
    verificationBadge: true,
    verificationDate: "2024-06-15",
    emergencyContact: "+1-555-0100",
    coordinatorName: "Dr. Emily Chen",
    coordinatorPhone: "+1-555-0101",
    coordinatorEmail: "emily.chen@citycentralhospital.org",
    operatingHours: "24/7",
    emergencyCapacity: "50 beds, 10 ICU",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<HospitalProfile>>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleEditStart = (field: keyof HospitalProfile) => {
    setEditingField(field);
    setEditValues({ [field]: profile[field] });
  };

  const handleEditSave = (field: keyof HospitalProfile) => {
    setProfile({
      ...profile,
      [field]: editValues[field] ?? profile[field],
    });
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Profile & Settings</h2>

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
            <Lock className="w-5 h-5 text-slate-600" />
            Hospital Profile (Admin Verified - Read Only)
          </CardTitle>
          <CardDescription>
            These fields are locked to prevent identity tampering
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
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-semibold text-slate-900">{value}</p>
                </div>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
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
                className="p-3 border rounded-lg hover:border-blue-300 transition-colors"
              >
                {editingField === key ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input
                      value={String(editValues[key as keyof HospitalProfile] ?? value)}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleEditSave(key as keyof HospitalProfile)}
                      >
                        <Save className="w-3 h-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="font-semibold text-slate-900 mt-1">{value}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditStart(key as keyof HospitalProfile)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
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
              { title: "Emergency Handling History", file: "emergency_history.pdf" },
              { title: "Blood Allocation Reports", file: "blood_allocation.pdf" },
              { title: "Donation Fulfillment Logs", file: "fulfillment_logs.csv" },
              { title: "Admin Approval Decisions", file: "admin_approvals.pdf" },
              { title: "Monthly Activity Summary", file: "monthly_summary.pdf" },
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
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs (Read-Only)</CardTitle>
          <CardDescription>
            Audit trail of all your actions for compliance and dispute resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { time: "2026-01-07 14:30", action: "Profile updated", details: "Coordinator email changed" },
              { time: "2026-01-07 09:15", action: "Emergency accepted", details: "Request EMERG-2026-001" },
              { time: "2026-01-06 18:45", action: "Blood allocation confirmed", details: "2 units O+ allocated" },
              { time: "2026-01-05 22:00", action: "Profile viewed", details: "By Admin: admin-001" },
              { time: "2026-01-04 10:30", action: "Login successful", details: "From IP 192.168.1.1" },
            ].map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded bg-slate-50">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.details}</p>
                </div>
                <p className="text-xs text-muted-foreground">{log.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Shield className="w-4 h-4" />
              Enable 2-Step Verification
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <LogOut className="w-4 h-4" />
              Logout from All Sessions
            </Button>
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You cannot change your role or disable admin monitoring
              </AlertDescription>
            </Alert>
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
                onClick={() => {
                  // Call logout API
                  window.location.href = "/";
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
