/**
 * PROFILE & SETTINGS PAGE
 * Purpose: Manage hospital identity, verification, and user preferences
 * 
 * Contains:
 * - Hospital profile details (name, location, contact info - read-only)
 * - Verification status and badge
 * - Hospital capacity settings (max simultaneous cases, staff count)
 * - Emergency handling preferences (auto-accept criteria, priority rules)
 * - Notification control settings (alert types, channels)
 * - Security settings (session timeout, two-factor auth)
 * - Staff accounts management (add/remove/edit staff)
 * - Verification documents upload
 * - Logout button
 * 
 * Access control:
 * - Only hospital_staff role can access this page
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Hospital, Users, FileText, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive';
}

export default function ProfileAndSettings() {
  const [hospitalDetails] = useState({
    name: 'City Central Hospital',
    registrationNumber: 'REG-2020-001234',
    address: '123 Main Street, City Center, Metro City 400001',
    phone: '+91 22 1234 5678',
    email: 'hospital@citycentralhospital.com',
    website: 'www.citycentralhospital.com',
    verificationStatus: 'verified',
    verificationDate: new Date('2023-06-15'),
    licenseExpiry: new Date('2026-06-14'),
    beds: 150,
    icuBeds: 15,
    operatingRooms: 6
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: 'staff-1',
      name: 'Dr. Rajesh Sharma',
      role: 'Emergency Head',
      email: 'rajesh.sharma@hospital.com',
      phone: '+91 98765 43210',
      department: 'Emergency',
      status: 'active'
    },
    {
      id: 'staff-2',
      name: 'Dr. Priya Patel',
      role: 'Transfusion Specialist',
      email: 'priya.patel@hospital.com',
      phone: '+91 99876 54321',
      department: 'Blood Bank',
      status: 'active'
    },
    {
      id: 'staff-3',
      name: 'Nurse Amit Singh',
      role: 'Emergency Nurse',
      email: 'amit.singh@hospital.com',
      phone: '+91 97654 32109',
      department: 'Emergency',
      status: 'active'
    }
  ]);

  const daysUntilExpiry = Math.floor((hospitalDetails.licenseExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Hospital Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="w-5 h-5" />
            Hospital Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Hospital Name</p>
                <p className="font-semibold text-lg">{hospitalDetails.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registration Number</p>
                <p className="font-semibold">{hospitalDetails.registrationNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <p className="text-sm">{hospitalDetails.address}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{hospitalDetails.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{hospitalDetails.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="text-sm text-primary">{hospitalDetails.website}</p>
              </div>
            </div>

            {/* Verification & Capacity */}
            <div className="space-y-4">
              <div className="p-4 bg-status-stable/10 rounded border border-status-stable">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-status-stable mt-1 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Verification Status</h4>
                    <Badge variant="default" className="mt-2">VERIFIED</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified on {hospitalDetails.verificationDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-status-warning/10 rounded border border-status-warning">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-status-warning mt-1 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">License Expiry</h4>
                    <p className="text-sm font-semibold mt-1">{daysUntilExpiry} days remaining</p>
                    <p className="text-xs text-muted-foreground">
                      Expires on {hospitalDetails.licenseExpiry.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Hospital Capacity</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>General Beds</span>
                      <span className="font-semibold">{hospitalDetails.beds}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>ICU Beds</span>
                      <span className="font-semibold">{hospitalDetails.icuBeds}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Operating Rooms</span>
                      <span className="font-semibold">{hospitalDetails.operatingRooms}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Hospital License', file: 'hospital_license.pdf', uploaded: new Date('2023-06-15') },
            { name: 'Registration Certificate', file: 'registration_cert.pdf', uploaded: new Date('2023-06-15') },
            { name: 'Blood Bank License', file: 'blood_bank_license.pdf', uploaded: new Date('2023-07-20') },
            { name: 'Medical Staff Credentials', file: 'staff_credentials.pdf', uploaded: new Date('2023-08-10') }
          ].map((doc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.file} • Uploaded {doc.uploaded.toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Staff Accounts */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Accounts & Access
          </CardTitle>
          <Button size="sm">Add Staff Member</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {staffMembers.map((staff, idx) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="p-4 border rounded space-y-2 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{staff.name}</h4>
                    <p className="text-sm text-muted-foreground">{staff.role} • {staff.department}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>📧 {staff.email}</span>
                      <span>📱 {staff.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={staff.status === 'active' ? 'default' : 'secondary'}
                    >
                      {staff.status.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Emergency Contact Number</p>
            <Input type="tel" placeholder="+91 22 1234 5678" defaultValue={hospitalDetails.phone} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Coordinator Email</p>
            <Input type="email" placeholder="coordinator@hospital.com" defaultValue={hospitalDetails.email} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Notification Preferences</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Email alerts for new emergencies</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">SMS alerts for urgent cases</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm">In-app notifications</span>
              </label>
            </div>
          </div>
          <Button variant="default">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
