import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Droplet, 
  AlertTriangle, 
  Clock,
  Plus,
  Minus,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BloodGroup } from '@/types/emergency';

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface BloodStock {
  [key: string]: number;
}

interface IncomingRequest {
  id: string;
  blood_group: string;
  units_required: number;
  urgency_level: string;
  hospital_name: string;
  created_at: string;
}

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bloodStock, setBloodStock] = useState<BloodStock>({
    'A+': 15, 'A-': 3, 'B+': 12, 'B-': 2, 'AB+': 5, 'AB-': 1, 'O+': 20, 'O-': 4
  });
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([
    {
      id: '1',
      blood_group: 'O-',
      units_required: 3,
      urgency_level: 'critical',
      hospital_name: 'Apollo Hospital',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      blood_group: 'B+',
      units_required: 2,
      urgency_level: 'warning',
      hospital_name: 'City General Hospital',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const adjustStock = (bloodGroup: string, delta: number) => {
    setBloodStock(prev => ({
      ...prev,
      [bloodGroup]: Math.max(0, (prev[bloodGroup] || 0) + delta)
    }));
    toast({
      title: delta > 0 ? "Stock Added" : "Stock Reduced",
      description: `${Math.abs(delta)} unit(s) of ${bloodGroup} ${delta > 0 ? 'added' : 'removed'}`
    });
  };

  const handleFulfillRequest = (requestId: string) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
      title: "Request Fulfilled",
      description: "Blood units have been dispatched"
    });
  };

  const totalUnits = Object.values(bloodStock).reduce((a, b) => a + b, 0);
  const lowStockTypes = Object.entries(bloodStock).filter(([_, count]) => count <= 3);
  const criticalStockTypes = Object.entries(bloodStock).filter(([_, count]) => count === 0);

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
                <Building2 className="w-8 h-8 text-[hsl(var(--blood-ab))]" />
                Blood Bank Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage inventory and fulfill requests
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
          </div>
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
            <p className="text-2xl font-bold">{totalUnits}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <Bell className="w-6 h-6 text-[hsl(var(--status-warning))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{incomingRequests.length}</p>
            <p className="text-xs text-muted-foreground">Pending Requests</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <TrendingDown className="w-6 h-6 text-[hsl(var(--status-warning))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{lowStockTypes.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock Types</p>
          </Card>

          <Card variant="glass" className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-[hsl(var(--status-critical))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{criticalStockTypes.length}</p>
            <p className="text-xs text-muted-foreground">Out of Stock</p>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Blood Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-primary" />
                  Blood Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bloodGroups.map(bg => {
                  const count = bloodStock[bg] || 0;
                  const isLow = count <= 3;
                  const isEmpty = count === 0;
                  const percentage = Math.min((count / 25) * 100, 100);

                  return (
                    <div key={bg} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BloodTypeBadge bloodGroup={bg} size="sm" showIcon={false} />
                          <span className={`text-sm font-semibold ${
                            isEmpty ? 'text-[hsl(var(--status-critical))]' : 
                            isLow ? 'text-[hsl(var(--status-warning))]' : ''
                          }`}>
                            {count} units
                          </span>
                          {isEmpty && (
                            <Badge variant="critical">OUT OF STOCK</Badge>
                          )}
                          {isLow && !isEmpty && (
                            <Badge variant="warning">LOW</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustStock(bg, -1)}
                            disabled={count === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustStock(bg, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            isEmpty ? 'bg-[hsl(var(--status-critical))]' :
                            isLow ? 'bg-[hsl(var(--status-warning))]' :
                            'bg-[hsl(var(--status-stable))]'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Incoming Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-warning))]" />
                  Incoming Requests
                  {incomingRequests.length > 0 && (
                    <Badge variant="critical">{incomingRequests.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingRequests.map(request => (
                      <Card 
                        key={request.id} 
                        variant={request.urgency_level === 'critical' ? 'emergency' : 'glass'}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                request.urgency_level === 'critical' ? 'critical' :
                                request.urgency_level === 'warning' ? 'warning' : 'stable'
                              }>
                                {request.urgency_level.toUpperCase()}
                              </Badge>
                              <BloodTypeBadge bloodGroup={request.blood_group as BloodGroup} size="sm" />
                            </div>
                            <p className="font-medium">{request.hospital_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.units_required} units needed
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleFulfillRequest(request.id)}
                              disabled={(bloodStock[request.blood_group] || 0) < request.units_required}
                            >
                              Fulfill
                            </Button>
                            <Button variant="outline" size="sm">
                              Decline
                            </Button>
                          </div>
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
    </div>
  );
}
