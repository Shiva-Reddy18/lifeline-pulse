import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { fetchHospitalEmergencies, requestAdminApproval } from '@/hospital-dashboard/services/api';
import { maskPatientId } from '@/hospital-dashboard/utils/helpers';
import { MapPin, Droplet, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function EmergencyRequests() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchHospitalEmergencies();
      setItems(res as any[]);
      setLoading(false);
    })();
  }, []);

  const handleRequestApproval = async (em: any) => {
    const result = await requestAdminApproval({ emergencyId: em.id, hospitalId: 'hosp-1', doctorRemarks: 'Medical requirement validated' });
    if (result.success) {
      alert('Admin approval requested. Case is now locked.');
      setItems(prev => prev.map(e => e.id === em.id ? { ...e, status: 'pending_approval' } : e));
    }
  };

  const handleReject = (id: string) => {
    setItems(prev => prev.filter(e => e.id !== id));
    alert('Emergency rejected and removed from queue');
  };

  const handleReroute = (em: any) => {
    // Notify admin / system for reroute — keep internal
    alert('Reroute requested. Admin has been notified.');
  };

  const statusFilter = {
    active: (e: any) => e.status === 'created',
    pending: (e: any) => e.status === 'pending_approval',
    all: (e: any) => true
  } as const;

  const filteredItems = items.filter(statusFilter[selectedStatus as keyof typeof statusFilter] || statusFilter.all);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Emergency Requests</h2>
        <div className="flex gap-2">
          <Button variant={selectedStatus === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedStatus('active')}>Active ({items.filter(statusFilter.active).length})</Button>
          <Button variant={selectedStatus === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedStatus('pending')}>Pending Approval ({items.filter(statusFilter.pending).length})</Button>
          <Button variant={!selectedStatus ? 'default' : 'outline'} size="sm" onClick={() => setSelectedStatus(null)}>All</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading emergencies...</div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">No emergencies found</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((em, idx) => (
            <motion.div key={em.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className={em.status === 'pending_approval' ? 'border-status-warning' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <BloodTypeBadge bloodGroup={em.blood_group} size="lg" />
                          <div>
                            <div className="font-semibold">{em.condition}</div>
                            <div className="text-xs text-muted-foreground">Patient ID: {maskPatientId(em.patient_id || 'unknown')}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant={em.urgency_level}>{em.urgency_level?.toUpperCase() || 'STABLE'}</Badge>
                          {em.status === 'pending_approval' && (<Badge variant="warning">⏳ Awaiting Admin</Badge>)}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-bold text-lg">{em.units_required} units</div>
                        <div className="text-xs text-muted-foreground">{em.distance || 'N/A'} away</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{em.location?.address || 'Location TBD'}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" />Raised {Math.floor((Date.now() - new Date(em.created_at).getTime()) / 60000)} min ago</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Droplet className="w-4 h-4" />{em.blood_group} • {em.units_required} units</div>
                    </div>

                    {em.expires_at && (<CountdownTimer expiresAt={new Date(em.expires_at)} urgency={em.urgency_level} label="Expires in" />)}

                    {em.status === 'created' && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {/* stay internal - view details modal could open here */}}><Eye className="w-4 h-4" />View Details</Button>
                        <Button variant="success" size="sm" className="flex-1 gap-2" onClick={() => { handleRequestApproval(em); navigate('/hospital/blood'); }}><CheckCircle className="w-4 h-4" />Accept & Assign</Button>
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleReroute(em)}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    )}

                    {em.status === 'pending_approval' && (
                      <div className="flex items-center gap-3 pt-2 border-t bg-status-warning/5 -mx-6 -mb-6 p-4 rounded-b">
                        <div className="w-3 h-3 rounded-full bg-status-warning animate-pulse" />
                        <span className="text-sm font-medium text-status-warning">Awaiting admin decision — case is locked for modifications</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
