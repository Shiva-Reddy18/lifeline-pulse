import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Clock, 
  MapPin, 
  AlertCircle, 
  History,
  ChevronRight,
  Bell,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmergencyButton } from '@/components/EmergencyButton';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { EmergencyStatus } from '@/types/emergency';

interface Emergency {
  id: string;
  blood_group: string;
  status: EmergencyStatus;
  urgency_level: string;
  location_address: string;
  created_at: string;
  expires_at: string;
  hospital_id: string | null;
  estimated_arrival_minutes: number | null;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [emergencyHistory, setEmergencyHistory] = useState<Emergency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmergencies();
      subscribeToEmergencies();
    }
  }, [user]);

  const fetchEmergencies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as unknown as Emergency[];
      const active = typedData.find(e => 
        !['fulfilled', 'auto_closed', 'expired'].includes(e.status)
      );
      
      setActiveEmergency(active || null);
      setEmergencyHistory(typedData.filter(e => 
        ['fulfilled', 'auto_closed', 'expired'].includes(e.status)
      ));
    } catch (e) {
      console.error('Error fetching emergencies:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToEmergencies = () => {
    if (!user) return;

    const channel = supabase
      .channel('patient-emergencies')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergencies',
          filter: `patient_id=eq.${user.id}`
        },
        () => {
          fetchEmergencies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleEmergencyTrigger = () => {
    navigate('/');
  };

  const getStatusMessage = (status: EmergencyStatus) => {
    const messages: Record<EmergencyStatus, string> = {
      created: 'Your emergency request is being processed...',
      hospital_verified: 'Hospital has verified your request',
      accepted: 'Help is on the way!',
      in_transit: 'Blood is being transported to you',
      fulfilled: 'Emergency resolved',
      auto_closed: 'Request was auto-closed',
      expired: 'Request expired'
    };
    return messages[status];
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
            Patient Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your emergency requests and get help instantly
          </p>
        </motion.div>

        {/* Active Emergency or Emergency Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {activeEmergency ? (
            <Card variant="emergency" className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Status Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant={
                      activeEmergency.urgency_level === 'critical' ? 'critical' :
                      activeEmergency.urgency_level === 'warning' ? 'warning' : 'stable'
                    }>
                      {activeEmergency.urgency_level.toUpperCase()}
                    </Badge>
                    <Badge variant="blood-o">{activeEmergency.blood_group}</Badge>
                  </div>

                  <h2 className="text-xl font-bold mb-2">
                    {getStatusMessage(activeEmergency.status)}
                  </h2>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    {activeEmergency.location_address || 'Location detected'}
                  </div>

                  {activeEmergency.estimated_arrival_minutes && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg mb-4">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        ETA: {activeEmergency.estimated_arrival_minutes} minutes
                      </span>
                    </div>
                  )}

                  <CountdownTimer 
                    expiresAt={new Date(activeEmergency.expires_at)} 
                    urgency={activeEmergency.urgency_level as 'stable' | 'warning' | 'critical'}
                  />

                  <div className="mt-6">
                    <StatusTimeline 
                      currentStatus={activeEmergency.status} 
                    />
                  </div>
                </div>

                {/* Live Map */}
                <div className="lg:w-1/2">
                  <LiveMap
                    center={{ lat: 17.385, lng: 78.4867 }}
                    markers={[
                      { id: 'patient', lat: 17.385, lng: 78.4867, type: 'patient', label: 'You' },
                      ...(activeEmergency.hospital_id ? [{
                        id: 'hospital',
                        lat: 17.395,
                        lng: 78.496,
                        type: 'hospital' as const,
                        label: 'Hospital',
                        eta: activeEmergency.estimated_arrival_minutes || undefined
                      }] : [])
                    ]}
                    showRoute={activeEmergency.status === 'in_transit'}
                    height="300px"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="elevated" className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">No Active Emergency</h2>
              <p className="text-muted-foreground mb-6">
                Press the button below if you need emergency blood assistance
              </p>
              <div className="flex justify-center">
                <EmergencyButton onTrigger={handleEmergencyTrigger} />
              </div>
            </Card>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <Card variant="glass" className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Notifications</h3>
                <p className="text-xs text-muted-foreground">View alerts</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          <Card 
            variant="glass" 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/blood-banks')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Blood Banks</h3>
                <p className="text-xs text-muted-foreground">Find nearby</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          <Card variant="glass" className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-status-stable/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-status-stable" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Language</h3>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>

        {/* Emergency History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Emergency History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No past emergencies</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencyHistory.map(emergency => (
                    <div 
                      key={emergency.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="blood-o">{emergency.blood_group}</Badge>
                        <div>
                          <p className="font-medium">
                            {new Date(emergency.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {emergency.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={emergency.status === 'fulfilled' ? 'stable' : 'secondary'}>
                        {emergency.status === 'fulfilled' ? 'Resolved' : 'Closed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
