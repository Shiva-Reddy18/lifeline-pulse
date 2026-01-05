import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  MapPin, 
  Clock,
  CheckCircle,
  Navigation,
  Phone,
  Package,
  Route,
  Timer,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BloodGroup } from '@/types/emergency';

interface TransportRequest {
  id: string;
  blood_group: BloodGroup;
  units: number;
  pickup: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
  };
  dropoff: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
  };
  urgency_level: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered';
  created_at: string;
  distance_km: number;
  eta_minutes: number;
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeRequest, setActiveRequest] = useState<TransportRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<TransportRequest[]>([
    {
      id: '1',
      blood_group: 'O-',
      units: 2,
      pickup: {
        name: 'City Blood Bank',
        address: '123 Main Street, Downtown',
        lat: 17.385,
        lng: 78.4867,
        phone: '+91 98765 43210'
      },
      dropoff: {
        name: 'Apollo Hospital',
        address: '456 Hospital Road, Jubilee Hills',
        lat: 17.395,
        lng: 78.496,
        phone: '+91 98765 43211'
      },
      urgency_level: 'critical',
      status: 'pending',
      created_at: new Date().toISOString(),
      distance_km: 5.2,
      eta_minutes: 15
    }
  ]);
  const [completedDeliveries, setCompletedDeliveries] = useState(12);

  const handleAcceptRequest = (request: TransportRequest) => {
    setActiveRequest({ ...request, status: 'accepted' });
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    toast({
      title: "Request Accepted",
      description: "Navigate to pickup location"
    });
  };

  const handleStartTransit = () => {
    if (activeRequest) {
      setActiveRequest({ ...activeRequest, status: 'in_transit' });
      toast({
        title: "In Transit",
        description: "Blood is being transported"
      });
    }
  };

  const handleCompleteDelivery = () => {
    if (activeRequest) {
      setCompletedDeliveries(prev => prev + 1);
      setActiveRequest(null);
      toast({
        title: "Delivery Complete!",
        description: "Thank you for saving a life!"
      });
    }
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
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2 flex items-center gap-3">
            <Truck className="w-8 h-8 text-[hsl(var(--status-stable))]" />
            Volunteer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Transport blood and save lives
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
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <Route className="w-6 h-6 text-[hsl(var(--status-warning))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{activeRequest ? 1 : 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-[hsl(var(--status-stable))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedDeliveries}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <Award className="w-6 h-6 text-[hsl(var(--blood-ab))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedDeliveries * 3}</p>
            <p className="text-xs text-muted-foreground">Lives Saved</p>
          </Card>
        </motion.div>

        {/* Active Request */}
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Card variant="emergency" className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="critical">ACTIVE TRANSPORT</Badge>
                    <BloodTypeBadge bloodGroup={activeRequest.blood_group} size="sm" />
                    <Badge variant="secondary">{activeRequest.units} units</Badge>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-4">
                    {/* Pickup */}
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--status-warning)/0.2)] flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[hsl(var(--status-warning))]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activeRequest.pickup.name}</p>
                        <p className="text-sm text-muted-foreground">{activeRequest.pickup.address}</p>
                        <Button variant="ghost" size="sm" className="gap-1 mt-1 h-7 text-xs">
                          <Phone className="w-3 h-3" />
                          {activeRequest.pickup.phone}
                        </Button>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-0.5 h-8 bg-border relative">
                        <Navigation className="w-4 h-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary rotate-180" />
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="flex items-start gap-3 p-3 bg-[hsl(var(--status-stable)/0.1)] rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--status-stable)/0.2)] flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-[hsl(var(--status-stable))]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activeRequest.dropoff.name}</p>
                        <p className="text-sm text-muted-foreground">{activeRequest.dropoff.address}</p>
                        <Button variant="ghost" size="sm" className="gap-1 mt-1 h-7 text-xs">
                          <Phone className="w-3 h-3" />
                          {activeRequest.dropoff.phone}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-muted-foreground" />
                      <span>{activeRequest.distance_km} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span>ETA: {activeRequest.eta_minutes} min</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    {activeRequest.status === 'accepted' && (
                      <Button variant="hero" className="flex-1 gap-2" onClick={handleStartTransit}>
                        <Navigation className="w-4 h-4" />
                        Start Transit
                      </Button>
                    )}
                    {activeRequest.status === 'in_transit' && (
                      <Button variant="success" className="flex-1 gap-2" onClick={handleCompleteDelivery}>
                        <CheckCircle className="w-4 h-4" />
                        Complete Delivery
                      </Button>
                    )}
                  </div>
                </div>

                {/* Map */}
                <div className="lg:w-1/2">
                  <LiveMap
                    center={{ lat: (activeRequest.pickup.lat + activeRequest.dropoff.lat) / 2, lng: (activeRequest.pickup.lng + activeRequest.dropoff.lng) / 2 }}
                    markers={[
                      { id: 'pickup', lat: activeRequest.pickup.lat, lng: activeRequest.pickup.lng, type: 'blood_bank' as any, label: 'Pickup' },
                      { id: 'dropoff', lat: activeRequest.dropoff.lat, lng: activeRequest.dropoff.lng, type: 'hospital', label: 'Dropoff' }
                    ]}
                    showRoute
                    height="300px"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Pending Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Available Transport Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="warning">{pendingRequests.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 && !activeRequest ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transport requests available</p>
                  <p className="text-sm mt-2">New requests will appear here</p>
                </div>
              ) : activeRequest ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Complete your active transport first</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <Card key={request.id} variant="glass" className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              request.urgency_level === 'critical' ? 'critical' :
                              request.urgency_level === 'warning' ? 'warning' : 'stable'
                            }>
                              {request.urgency_level.toUpperCase()}
                            </Badge>
                            <BloodTypeBadge bloodGroup={request.blood_group} size="sm" />
                            <Badge variant="secondary">{request.units} units</Badge>
                          </div>
                          <p className="font-medium">
                            {request.pickup.name} → {request.dropoff.name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Route className="w-3 h-3" />
                              {request.distance_km} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              ~{request.eta_minutes} min
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </Button>
                      </div>
                    </Card>
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
