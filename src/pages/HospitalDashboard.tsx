import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import { BloodGroup, EmergencyRequest, UrgencyLevel } from '@/types/emergency';
import { 
  Hospital,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Users,
  Droplet,
  Activity,
  Phone,
  Send,
  RefreshCw
} from 'lucide-react';

// Mock incoming emergencies
const mockEmergencies: EmergencyRequest[] = [
  {
    id: 'em-1',
    patientName: 'Anonymous Patient',
    bloodGroup: 'O-',
    unitsRequired: 3,
    location: { lat: 17.385, lng: 78.4867, address: '123 Accident Site, Highway 7' },
    status: 'created',
    urgencyLevel: 'critical',
    condition: 'Trauma - Road Accident',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    expiresAt: new Date(Date.now() + 1.75 * 60 * 60 * 1000),
  },
  {
    id: 'em-2',
    patientName: 'Anonymous Patient',
    bloodGroup: 'B+',
    unitsRequired: 2,
    location: { lat: 17.390, lng: 78.490, address: '456 Residential Area, Block C' },
    status: 'created',
    urgencyLevel: 'warning',
    condition: 'Dengue - Platelet Required',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    expiresAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
  },
  {
    id: 'em-3',
    patientName: 'Anonymous Patient',
    bloodGroup: 'A+',
    unitsRequired: 4,
    location: { lat: 17.380, lng: 78.480, address: '789 City Hospital, Surgery Wing' },
    status: 'hospital_verified',
    urgencyLevel: 'stable',
    condition: 'Scheduled Surgery',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
  },
];

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Mock blood stock
const mockBloodStock: Record<BloodGroup, number> = {
  'A+': 15, 'A-': 3, 'B+': 12, 'B-': 2, 'AB+': 5, 'AB-': 1, 'O+': 20, 'O-': 4
};

export default function HospitalDashboard() {
  const [emergencies, setEmergencies] = useState(mockEmergencies);
  const [bloodStock, setBloodStock] = useState(mockBloodStock);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAccept = (id: string) => {
    setEmergencies(prev => prev.map(em => 
      em.id === id 
        ? { ...em, status: 'accepted' as const, hospital: { id: 'hosp-1', name: 'City Central Hospital', phone: '+91 98765 43210' } }
        : em
    ));
  };

  const handleDecline = (id: string) => {
    setEmergencies(prev => prev.filter(em => em.id !== id));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const stats = [
    { label: 'Pending Requests', value: emergencies.filter(e => e.status === 'created').length, icon: AlertTriangle, variant: 'warning' as const },
    { label: 'Active Requests', value: emergencies.filter(e => ['hospital_verified', 'accepted', 'in_transit'].includes(e.status)).length, icon: Activity, variant: 'stable' as const },
    { label: 'Total Donors', value: 127, icon: Users, variant: 'stable' as const },
    { label: 'Blood Units', value: Object.values(bloodStock).reduce((a, b) => a + b, 0), icon: Droplet, variant: 'stable' as const },
  ];

  const getUrgencyOrder = (urgency: UrgencyLevel) => {
    return { critical: 0, warning: 1, stable: 2 }[urgency];
  };

  const sortedEmergencies = [...emergencies].sort((a, b) => 
    getUrgencyOrder(a.urgencyLevel) - getUrgencyOrder(b.urgencyLevel)
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <Badge variant="verified" className="mb-2">
              <Hospital className="w-3 h-3 mr-1" />
              Hospital Portal
            </Badge>
            <h1 className="text-3xl font-display font-bold">
              City Central Hospital
            </h1>
            <p className="text-muted-foreground">
              Emergency Blood Request Management
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} variant="elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.variant === 'warning' ? 'bg-status-warning/10' : 'bg-status-stable/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        stat.variant === 'warning' ? 'text-status-warning' : 'text-status-stable'
                      }`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Emergency Requests */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Incoming Emergencies</h2>
              <Badge variant="urgent">
                {emergencies.filter(e => e.status === 'created').length} pending
              </Badge>
            </div>

            {sortedEmergencies.length === 0 ? (
              <Card variant="elevated" className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-status-stable mx-auto mb-4" />
                <h3 className="font-semibold">All Clear</h3>
                <p className="text-muted-foreground">No pending emergency requests</p>
              </Card>
            ) : (
              sortedEmergencies.map((emergency, index) => (
                <motion.div
                  key={emergency.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    variant={emergency.urgencyLevel === 'critical' ? 'emergency' : 'elevated'} 
                    className="overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <BloodTypeBadge bloodGroup={emergency.bloodGroup} size="lg" />
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{emergency.condition}</CardTitle>
                              <Badge variant={emergency.urgencyLevel}>
                                {emergency.urgencyLevel.toUpperCase()}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {emergency.location.address}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusTimeline currentStatus={emergency.status} compact />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Droplet className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{emergency.unitsRequired} units needed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {Math.floor((Date.now() - emergency.createdAt.getTime()) / 60000)} min ago
                          </span>
                        </div>
                      </div>

                      <CountdownTimer 
                        expiresAt={emergency.expiresAt} 
                        urgency={emergency.urgencyLevel}
                        label="Expires in"
                      />

                      {emergency.status === 'created' && (
                        <div className="flex items-center gap-3 pt-2 border-t">
                          <Button
                            variant="success"
                            className="flex-1 gap-2"
                            onClick={() => handleAccept(emergency.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept & Assign
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleDecline(emergency.id)}
                          >
                            <Send className="w-4 h-4" />
                            Reroute
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDecline(emergency.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {emergency.status === 'accepted' && (
                        <div className="flex items-center gap-3 pt-2 border-t bg-status-stable/5 -mx-6 -mb-6 p-4">
                          <CheckCircle className="w-5 h-5 text-status-stable" />
                          <span className="font-medium text-status-stable">Request Accepted - Coordinating donors</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Blood Stock Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Blood Stock</h2>
            
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-primary" />
                  Current Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bloodGroups.map(bg => {
                  const count = bloodStock[bg];
                  const percentage = Math.min((count / 25) * 100, 100);
                  const isLow = count <= 3;
                  const isEmpty = count === 0;

                  return (
                    <div key={bg} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <BloodTypeBadge bloodGroup={bg} size="sm" showIcon={false} />
                        <span className={`text-sm font-semibold ${
                          isEmpty ? 'text-status-critical' : isLow ? 'text-status-warning' : ''
                        }`}>
                          {count} units
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            isEmpty ? 'bg-status-critical' :
                            isLow ? 'bg-status-warning' :
                            'bg-status-stable'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="w-4 h-4" />
                  View Available Donors
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Blood Banks
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Activity className="w-4 h-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
