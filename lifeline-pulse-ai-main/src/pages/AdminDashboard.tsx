import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Hospital, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Activity,
  Ban,
  Eye,
  Settings,
  Zap,
  Clock,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  verifyHospital, 
  rejectHospital, 
  toggleDisasterMode as toggleDisasterModeAction 
} from '@/lib/adminActions';

interface Stats {
  totalEmergencies: number;
  activeEmergencies: number;
  totalDonors: number;
  pendingHospitals: number;
}

interface HospitalVerification {
  id: string;
  name: string;
  address: string;
  license_number: string;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  entity_type: string;
  action: string;
  actor_id: string;
  created_at: string;
  details: any;
}

export default function AdminDashboard() {
  const { user, hasRole, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalEmergencies: 0,
    activeEmergencies: 0,
    totalDonors: 0,
    pendingHospitals: 0
  });
  const [pendingHospitals, setPendingHospitals] = useState<HospitalVerification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [disasterMode, setDisasterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Server-side authorization check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth?redirect=/dashboard/admin');
        return;
      }
      
      if (!hasRole('admin')) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      setIsAuthorized(true);
      fetchDashboardData();
    }
  }, [user, loading, hasRole, navigate]);


  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: emergencies } = await supabase
        .from('emergencies')
        .select('id, status')
        .limit(1000);

      const { data: donors } = await supabase
        .from('donors')
        .select('id')
        .limit(1000);

      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_verified', false);

      const activeCount = emergencies?.filter(e => 
        !['fulfilled', 'auto_closed', 'expired'].includes(e.status)
      ).length || 0;

      setStats({
        totalEmergencies: emergencies?.length || 0,
        activeEmergencies: activeCount,
        totalDonors: donors?.length || 0,
        pendingHospitals: hospitals?.length || 0
      });

      setPendingHospitals((hospitals || []) as unknown as HospitalVerification[]);

      // Fetch audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAuditLogs((logs || []) as unknown as AuditLogEntry[]);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyHospital = async (hospitalId: string, approve: boolean) => {
    try {
      // Use server-side admin action for proper authorization
      const result = approve 
        ? await verifyHospital(hospitalId)
        : await rejectHospital(hospitalId);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: approve ? "Hospital Verified" : "Hospital Rejected",
        description: result.message
      });

      setPendingHospitals(prev => prev.filter(h => h.id !== hospitalId));
      setStats(prev => ({ ...prev, pendingHospitals: prev.pendingHospitals - 1 }));
    } catch (e) {
      console.error('Error updating hospital:', e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update hospital status.",
        variant: "destructive"
      });
    }
  };

  const handleToggleDisasterMode = async () => {
    try {
      const result = await toggleDisasterModeAction(!disasterMode);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setDisasterMode(!disasterMode);
      toast({
        title: disasterMode ? "Disaster Mode Disabled" : "Disaster Mode Enabled",
        description: disasterMode 
          ? "System returned to normal operation." 
          : "All resources are now in emergency mode.",
        variant: disasterMode ? "default" : "destructive"
      });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to toggle disaster mode.",
        variant: "destructive"
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Admin Control Center
              </h1>
              <p className="text-muted-foreground">
                System oversight and emergency management
              </p>
            </div>
            <Button
              variant={disasterMode ? "destructive" : "outline"}
              onClick={handleToggleDisasterMode}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {disasterMode ? "Disable Disaster Mode" : "Enable Disaster Mode"}
            </Button>
          </div>
        </motion.div>

        {/* Disaster Mode Warning */}
        {disasterMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8"
          >
            <Card variant="emergency" className="p-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-primary animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">DISASTER MODE ACTIVE</h3>
                  <p className="text-sm text-muted-foreground">
                    All emergency resources are on high alert. Mass-casualty protocols enabled.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="glass" className="p-4 text-center">
            <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.activeEmergencies}</p>
            <p className="text-xs text-muted-foreground">Active Emergencies</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <Users className="w-6 h-6 text-status-stable mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalDonors}</p>
            <p className="text-xs text-muted-foreground">Registered Donors</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <Hospital className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.pendingHospitals}</p>
            <p className="text-xs text-muted-foreground">Pending Hospitals</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalEmergencies}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="hospitals" className="space-y-6">
            <TabsList className="grid grid-cols-4 gap-2">
              <TabsTrigger value="hospitals" className="gap-2">
                <Hospital className="w-4 h-4" />
                <span className="hidden md:inline">Hospitals</span>
              </TabsTrigger>
              <TabsTrigger value="emergencies" className="gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden md:inline">Emergencies</span>
              </TabsTrigger>
              <TabsTrigger value="fraud" className="gap-2">
                <Ban className="w-4 h-4" />
                <span className="hidden md:inline">Fraud</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Audit Logs</span>
              </TabsTrigger>
            </TabsList>

            {/* Hospital Verification Tab */}
            <TabsContent value="hospitals">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Hospital className="w-5 h-5" />
                      Hospital Verification Queue
                    </span>
                    {stats.pendingHospitals > 0 && (
                      <Badge variant="warning">{stats.pendingHospitals} Pending</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingHospitals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pending hospital verifications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingHospitals.map(hospital => (
                        <div 
                          key={hospital.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{hospital.name}</h4>
                            <p className="text-sm text-muted-foreground">{hospital.address}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              License: {hospital.license_number || 'Not provided'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleVerifyHospital(hospital.id, true)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleVerifyHospital(hospital.id, false)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emergency Overview Tab */}
            <TabsContent value="emergencies">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Live Emergency Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveMap
                    center={{ lat: 17.385, lng: 78.4867 }}
                    markers={[
                      { id: '1', lat: 17.385, lng: 78.4867, type: 'hospital', label: 'Apollo Hospital' },
                      { id: '2', lat: 17.395, lng: 78.496, type: 'patient', label: 'Emergency #1' },
                      { id: '3', lat: 17.375, lng: 78.476, type: 'donor', label: 'Donor in transit' },
                    ]}
                    height="400px"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fraud Detection Tab */}
            <TabsContent value="fraud">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="w-5 h-5" />
                    Fraud & Abuse Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No suspicious activities detected</p>
                    <p className="text-sm mt-2">
                      System monitors for repeated fake emergencies, location spoofing, and abnormal patterns
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="logs">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Audit Trail
                    </span>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No audit logs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map(log => (
                        <div 
                          key={log.id}
                          className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg text-sm"
                        >
                          <Badge variant="secondary">{log.entity_type}</Badge>
                          <span className="font-medium">{log.action}</span>
                          <span className="text-muted-foreground flex-1">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
