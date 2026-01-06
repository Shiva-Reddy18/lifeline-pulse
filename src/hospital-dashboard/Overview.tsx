/**
 * OVERVIEW PAGE
 * Purpose: Quick situational awareness for hospital staff
 * 
 * What it shows:
 * - Total active emergencies with urgency indicators (critical, warning, stable)
 * - Blood units required vs available inventory
 * - Admin approval status (pending approvals count)
 * - In-progress case count and closed cases
 * - Nearby emergencies on live map view
 * - Recent emergencies list with quick actions
 * 
 * Quick actions from here:
 * - View full Emergency Requests list for detailed filtering
 * - Open Live Map for GPS tracking of emergencies
 * - Check Notifications for system alerts and updates
 * 
 * Goal: Let hospital staff understand overall readiness in seconds
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveMap } from '@/components/LiveMap';
import { fetchHospitalEmergencies } from './services/api';
import { AlertTriangle, Activity, Droplet, Clock, CheckCircle, FileText } from 'lucide-react';

interface EmergencySummary {
  active: number;
  pendingApproval: number;
  bloodUnitsRequested: number;
  inProgress: number;
  closed: number;
}

export default function Overview() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [summary, setSummary] = useState<EmergencySummary>({
    active: 0,
    pendingApproval: 0,
    bloodUnitsRequested: 0,
    inProgress: 0,
    closed: 0
  });

  useEffect(() => {
    (async () => {
      const items = await fetchHospitalEmergencies();
      setEmergencies(items.slice(0, 10));

      // Calculate summary stats
      setSummary({
        active: items.filter(e => e.status === 'created').length,
        pendingApproval: items.filter(e => e.status === 'pending_approval').length,
        bloodUnitsRequested: items.reduce((sum: number, e: any) => sum + (e.units_required || 0), 0),
        inProgress: items.filter(e => e.status === 'in_progress').length,
        closed: items.filter(e => e.status === 'fulfilled').length
      });
    })();
  }, []);

  const stats = [
    { label: 'Active Emergencies', value: summary.active, icon: AlertTriangle, color: 'text-status-critical' },
    { label: 'Pending Approvals', value: summary.pendingApproval, icon: FileText, color: 'text-status-warning' },
    { label: 'Blood Units Needed', value: summary.bloodUnitsRequested, icon: Droplet, color: 'text-primary' },
    { label: 'In Progress', value: summary.inProgress, icon: Activity, color: 'text-status-stable' },
    { label: 'Closed Cases', value: summary.closed, icon: CheckCircle, color: 'text-status-stable' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mini Map */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Nearby Emergencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Live map view</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Emergencies */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-semibold">Recent Emergencies</h3>
          {emergencies.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active emergencies
              </CardContent>
            </Card>
          ) : (
            emergencies.map((em, idx) => (
              <motion.div
                key={em.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={em.urgency_level || 'default'}>
                            {em.urgency_level || 'STANDARD'}
                          </Badge>
                          <span className="font-semibold text-sm">{em.blood_group}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{em.condition}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{em.units_required} units</span>
                          <span>Distance: {em.distance || 'N/A'}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{em.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
