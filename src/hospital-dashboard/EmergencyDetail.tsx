/**
 * EMERGENCY DETAIL PAGE
 * Purpose: Detailed view of a single emergency with full medical and approval workflow
 * 
 * Shows:
 * - Patient information (limited, respecting privacy)
 * - Complete blood requirements and compatibility
 * - Medical condition and doctor's assessment
 * - AI-generated criticality score (1-100)
 * - Doctor remarks field for medical notes
 * - Full approval workflow status
 * - Timeline of all status updates
 * 
 * Actions:
 * - Request Admin Approval (locks case)
 * - Reject or Reroute emergency
 * - Update doctor remarks
 * - View full case timeline
 * - Assign to blood coordination team
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import { Input } from '@/components/ui/input';
import { fetchEmergencyById, requestAdminApproval } from './services/api';
import { maskPatientId } from './utils/helpers';
import { ArrowLeft, MapPin, Activity, Droplet, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EmergencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emergency, setEmergency] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [currentStatus, setCurrentStatus] = useState('awaiting_blood');
  const [approvalRequested, setApprovalRequested] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const res = await fetchEmergencyById(id);
      setEmergency(res);
      setCurrentStatus(res?.status || 'awaiting_blood');
      setLoading(false);
    })();
  }, [id]);

  const handleRequestApproval = async () => {
    if (!emergency) return;
    const result = await requestAdminApproval({
      emergencyId: emergency.id,
      hospitalId: 'hosp-1',
      doctorRemarks,
      hospitalCapacity: { beds: 15, icu: 3 },
      bloodAvailable: { 'O-': 2, 'O+': 5 }
    });
    if (result.success) {
      setApprovalRequested(true);
      alert('Admin approval requested. This case is now locked.');
    }
  };

  const handleStatusUpdate = (status: string) => {
    setCurrentStatus(status);
    alert(`Status updated to: ${status}`);
  };

  if (loading) return <div className="text-center py-8">Loading emergency details...</div>;
  if (!emergency) return <div className="text-center py-8 text-muted-foreground">Emergency not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/hospital/requests')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Emergency {emergency.id}</h1>
          <p className="text-muted-foreground">Patient: {maskPatientId(emergency.patient_id || 'unknown')}</p>
        </div>
        <Badge variant={emergency.urgency_level}>{emergency.urgency_level?.toUpperCase()}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <BloodTypeBadge bloodGroup={emergency.blood_group} size="lg" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="font-semibold">{emergency.condition}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vitals - Hemoglobin</p>
                  <p className="font-semibold">9.2 g/dL</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Platelets</p>
                  <p className="font-semibold">45,000/μL</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {emergency.location?.address || 'Location TBD'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(emergency.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Blood Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="w-5 h-5" />
                Blood Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Units Required</p>
                  <p className="text-2xl font-bold">{emergency.units_required}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="text-2xl font-bold">{emergency.blood_group}</p>
                </div>
              </div>
              {emergency.expires_at && (
                <CountdownTimer
                  expiresAt={new Date(emergency.expires_at)}
                  urgency={emergency.urgency_level}
                  label="Critical window"
                />
              )}
            </CardContent>
          </Card>

          {/* AI Criticality & Risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                AI Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Criticality Score</span>
                  <span className="font-bold text-lg">9.2/10</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-status-critical h-2 rounded-full w-[92%]" />
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>🚩 Risk: Potential hemorrhagic shock within 4 hours</p>
                <p>💡 Suggested units: 4-6 packs</p>
                <p>⏱️ Predicted ETA (blood): 45 mins</p>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Remarks */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Remarks (for Admin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                placeholder="Add clinical notes, patient status, any special requirements..."
                className="w-full p-3 border rounded-md text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={approvalRequested}
              />
              <p className="text-xs text-muted-foreground">
                These remarks will be sent to admin when you request approval
              </p>
            </CardContent>
          </Card>

          {/* Status Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentStatus === 'awaiting_blood' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('awaiting_blood')}
                  disabled={approvalRequested && currentStatus !== 'awaiting_blood'}
                >
                  Awaiting Blood
                </Button>
                <Button
                  variant={currentStatus === 'blood_received' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('blood_received')}
                  disabled={approvalRequested && currentStatus !== 'blood_received'}
                >
                  Blood Received
                </Button>
                <Button
                  variant={currentStatus === 'transfusion_started' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('transfusion_started')}
                  disabled={approvalRequested && currentStatus !== 'transfusion_started'}
                >
                  Transfusion Started
                </Button>
                <Button
                  variant={currentStatus === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={approvalRequested && currentStatus !== 'completed'}
                >
                  Completed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hospital Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!approvalRequested ? (
                <>
                  <Button
                    variant="success"
                    className="w-full gap-2"
                    onClick={handleRequestApproval}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Request Admin Approval
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Confirm medical need and send request to admin with remarks
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-status-warning/10 rounded border border-status-warning">
                    <p className="text-sm font-medium text-status-warning">
                      ⏳ Awaiting Admin Decision
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This case is locked. You can only update status until approval/rejection.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Case Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={emergency.status} compact />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
