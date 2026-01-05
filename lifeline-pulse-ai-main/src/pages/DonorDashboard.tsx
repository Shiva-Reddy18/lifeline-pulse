import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Clock, 
  MapPin, 
  CheckCircle,
  XCircle,
  Calendar,
  Award,
  AlertTriangle,
  Navigation,
  Droplet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DonorProfile {
  id: string;
  blood_group: string;
  last_donation_date: string | null;
  total_donations: number;
  is_eligible: boolean;
  credibility_score: number;
}

interface EmergencyRequest {
  id: string;
  blood_group: string;
  urgency_level: string;
  condition: string;
  location_address: string;
  created_at: string;
  hospital_name?: string;
  distance_km?: number;
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [pendingRequests, setPendingRequests] = useState<EmergencyRequest[]>([]);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysUntilEligible, setDaysUntilEligible] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchDonorData();
    }
  }, [user]);

  const fetchDonorData = async () => {
    if (!user) return;

    try {
      // Fetch donor profile
      const { data: donor, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (donorError) throw donorError;

      if (donor) {
        setDonorProfile(donor as unknown as DonorProfile);
        
        // Calculate days until eligible
        if (donor.last_donation_date) {
          const lastDonation = new Date(donor.last_donation_date);
          const eligibleDate = new Date(lastDonation);
          eligibleDate.setDate(eligibleDate.getDate() + 90);
          const today = new Date();
          const diffTime = eligibleDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysUntilEligible(diffDays > 0 ? diffDays : 0);
        }

        // Fetch donation history
        const { data: history } = await supabase
          .from('donation_history')
          .select('*')
          .eq('donor_id', donor.id)
          .order('donation_date', { ascending: false })
          .limit(10);

        setDonationHistory(history || []);
      }

      // For demo, create some mock pending requests
      // In production, this would come from the database based on blood compatibility
      setPendingRequests([
        {
          id: '1',
          blood_group: donor?.blood_group || 'O+',
          urgency_level: 'critical',
          condition: 'trauma',
          location_address: 'Apollo Hospital, Jubilee Hills',
          created_at: new Date().toISOString(),
          hospital_name: 'Apollo Hospital',
          distance_km: 3.2
        }
      ]);
    } catch (e) {
      console.error('Error fetching donor data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    toast({
      title: "Request Accepted",
      description: "Navigate to the hospital. Thank you for saving a life!",
    });
  };

  const handleDeclineRequest = async (requestId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Request Declined",
      description: "The request has been passed to other donors.",
    });
  };

  const eligibilityProgress = daysUntilEligible !== null 
    ? Math.max(0, ((90 - daysUntilEligible) / 90) * 100)
    : 100;

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
            Donor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Thank you for being a life saver
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="glass" className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Droplet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{donorProfile?.blood_group || '--'}</p>
            <p className="text-xs text-muted-foreground">Blood Type</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-status-stable/20 flex items-center justify-center mx-auto mb-2">
              <Heart className="w-5 h-5 text-status-stable" />
            </div>
            <p className="text-2xl font-bold">{donorProfile?.total_donations || 0}</p>
            <p className="text-xs text-muted-foreground">Donations</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold">{donorProfile?.credibility_score || 100}</p>
            <p className="text-xs text-muted-foreground">Trust Score</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
              donorProfile?.is_eligible ? 'bg-status-stable/20' : 'bg-status-warning/20'
            }`}>
              {donorProfile?.is_eligible ? (
                <CheckCircle className="w-5 h-5 text-status-stable" />
              ) : (
                <Clock className="w-5 h-5 text-status-warning" />
              )}
            </div>
            <p className="text-2xl font-bold">
              {donorProfile?.is_eligible ? 'Yes' : `${daysUntilEligible}d`}
            </p>
            <p className="text-xs text-muted-foreground">Eligible</p>
          </Card>
        </motion.div>

        {/* Eligibility Progress */}
        {!donorProfile?.is_eligible && daysUntilEligible !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Calendar className="w-5 h-5 text-status-warning" />
                <div className="flex-1">
                  <p className="font-medium">Cool-down Period</p>
                  <p className="text-sm text-muted-foreground">
                    {daysUntilEligible} days until you can donate again
                  </p>
                </div>
              </div>
              <Progress value={eligibilityProgress} className="h-2" />
            </Card>
          </motion.div>
        )}

        {/* Incoming Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
                Incoming Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="critical">{pendingRequests.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!donorProfile?.is_eligible ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You'll receive requests once eligible to donate</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests. Stay ready to save lives!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <Card 
                      key={request.id} 
                      variant="emergency" 
                      className="p-4"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              request.urgency_level === 'critical' ? 'critical' :
                              request.urgency_level === 'warning' ? 'warning' : 'stable'
                            }>
                              {request.urgency_level.toUpperCase()}
                            </Badge>
                            <BloodTypeBadge bloodGroup={request.blood_group as any} size="sm" />
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>{request.condition}</strong> case at {request.hospital_name}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {request.distance_km} km away
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(request.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineRequest(request.id)}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </Button>
                        </div>
                      </div>

                      {/* Mini Map */}
                      <div className="mt-4">
                        <LiveMap
                          center={{ lat: 17.385, lng: 78.4867 }}
                          markers={[
                            { id: 'you', lat: 17.385, lng: 78.4867, type: 'donor', label: 'You' },
                            { id: 'hospital', lat: 17.395, lng: 78.496, type: 'hospital', label: request.hospital_name }
                          ]}
                          showRoute
                          height="150px"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Donation History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Donation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Droplet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No donations yet. Be the first to save a life!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donationHistory.map((donation, i) => (
                    <div 
                      key={donation.id || i}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-status-stable/20 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-status-stable" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(donation.donation_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {donation.units_donated} unit(s)
                          </p>
                        </div>
                      </div>
                      <Badge variant="stable">Verified</Badge>
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
