import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import type { EmergencyRequest, EmergencyStatus as EmergencyStatusType } from '@/types/emergency';
import { 
  Heart, 
  MapPin, 
  Phone, 
  Hospital,
  Clock,
  User,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Truck
} from 'lucide-react';

// Mock emergency request data
const mockRequest: EmergencyRequest = {
  id: 'demo-request',
  patientName: 'Emergency Patient',
  bloodGroup: 'B+',
  unitsRequired: 2,
  location: {
    lat: 17.385,
    lng: 78.4867,
    address: 'City Central Hospital, Downtown',
  },
  hospital: {
    id: 'hosp-1',
    name: 'City Central Hospital',
    phone: '+91 98765 43210',
  },
  status: 'hospital_verified',
  urgencyLevel: 'warning',
  condition: 'Surgery',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  estimatedTime: 45,
};

export default function EmergencyStatusPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<EmergencyRequest>(mockRequest);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const statuses: EmergencyStatusType[] = [
      'created',
      'hospital_verified',
      'accepted',
      'in_transit',
      'fulfilled',
    ];
    
    const currentIndex = statuses.indexOf(request.status);
    
    if (currentIndex < statuses.length - 1 && currentIndex >= 0) {
      const timer = setTimeout(() => {
        setRequest(prev => ({
          ...prev,
          status: statuses[currentIndex + 1],
          urgencyLevel: currentIndex >= 2 ? 'stable' : prev.urgencyLevel,
        }));
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [request.status]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusMessage = () => {
    switch (request.status) {
      case 'created': return 'Your emergency request has been created and is being routed to nearby hospitals.';
      case 'hospital_verified': return 'A hospital has verified your request and is coordinating blood availability.';
      case 'accepted': return 'Blood units have been reserved. A volunteer is being assigned for pickup.';
      case 'in_transit': return 'Blood is on the way! Track the delivery in real-time.';
      case 'fulfilled': return 'Blood has been delivered successfully. We hope for a speedy recovery.';
      default: return 'Processing your request...';
    }
  };

  const isFulfilled = request.status === 'fulfilled';

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant={isFulfilled ? 'elevated' : 'emergency'} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="text-center">
                  <motion.div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isFulfilled ? 'bg-status-stable/10' : 'bg-primary/10'}`} animate={!isFulfilled ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
                    {isFulfilled ? <CheckCircle className="w-10 h-10 text-status-stable" /> : request.status === 'in_transit' ? <Truck className="w-10 h-10 text-primary" /> : <Heart className="w-10 h-10 text-primary animate-heartbeat" />}
                  </motion.div>
                  <Badge variant={isFulfilled ? 'verified' : request.urgencyLevel} className="mb-2">{isFulfilled ? 'COMPLETED' : request.status.replace('_', ' ').toUpperCase()}</Badge>
                  <h1 className="text-2xl font-display font-bold mb-2">{isFulfilled ? 'Request Fulfilled!' : 'Emergency In Progress'}</h1>
                  <p className="text-muted-foreground mb-6">{getStatusMessage()}</p>
                  {!isFulfilled && <CountdownTimer expiresAt={request.expiresAt} urgency={request.urgencyLevel} />}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="elevated">
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Request Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><span className="text-sm text-muted-foreground">Blood Type</span><div><BloodTypeBadge bloodGroup={request.bloodGroup} size="lg" /></div></div>
                  <div className="space-y-1"><span className="text-sm text-muted-foreground">Units Required</span><p className="text-xl font-bold">{request.unitsRequired} units</p></div>
                  <div className="space-y-1"><span className="text-sm text-muted-foreground">Condition</span><p className="font-semibold">{request.condition}</p></div>
                  <div className="space-y-1"><span className="text-sm text-muted-foreground">Est. Time</span><div className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /><span className="font-semibold">{request.estimatedTime} min</span></div></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {request.hospital && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card variant="elevated">
                <CardHeader><CardTitle className="flex items-center gap-2"><Hospital className="w-5 h-5 text-secondary" />Assigned Hospital</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0"><Hospital className="w-6 h-6 text-secondary" /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{request.hospital.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><MapPin className="w-4 h-4" />{request.location.address}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><Phone className="w-4 h-4" />{request.hospital.phone}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(`tel:${request.hospital?.phone}`, '_self')}><Phone className="w-4 h-4" />Call</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatusTimeline currentStatus={request.status} />
          </motion.div>

          {isFulfilled && (
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Button variant="hero" className="w-full" onClick={() => navigate('/')}><Heart className="w-5 h-5" />Return Home</Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
