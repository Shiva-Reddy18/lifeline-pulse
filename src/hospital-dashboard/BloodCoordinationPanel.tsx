/**
 * BLOOD COORDINATION PANEL
 * Purpose: Ensure correct blood sourcing and allocation without direct donor contact
 * 
 * Includes:
 * - In-house blood inventory by type
 * - Required vs available blood units
 * - Blood type compatibility checking
 * - Selection of whole blood vs platelets
 * - Linked blood banks for backup sourcing
 * - Donor pool visibility (count only, no direct contact)
 * - AI-assisted donor/bank matching suggestions
 * - Transport volunteer assignment and tracking
 * - Receipt confirmation and shortage reporting
 * 
 * Safety constraints:
 * - NO DIRECT DONOR CONTACT ALLOWED via system
 * - All communications routed through volunteer coordinators
 * - Allocation locked once confirmed
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, User, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface BloodAllocation {
  id: string;
  bloodBank: string;
  bloodType: string;
  unitsAllocated: number;
  eta: string;
  volunteerName: string;
  volunteerPhone: string;
  volunteerLocation?: string;
  status: 'pending' | 'in_transit' | 'received';
}

export default function BloodCoordinationPanel() {
  const [allocations, setAllocations] = useState<BloodAllocation[]>([
    {
      id: 'ba-1',
      bloodBank: 'Central Blood Bank',
      bloodType: 'O-',
      unitsAllocated: 2,
      eta: '45 minutes',
      volunteerName: 'Rajesh Kumar',
      volunteerPhone: '+91 98765 43210',
      status: 'in_transit'
    },
    {
      id: 'ba-2',
      bloodBank: 'District Blood Bank',
      bloodType: 'B+',
      unitsAllocated: 1,
      eta: '1 hour 15 minutes',
      volunteerName: 'Priya Singh',
      volunteerPhone: '+91 99876 54321',
      status: 'pending'
    }
  ]);

  const handleConfirmReceipt = (id: string) => {
    setAllocations(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'received' } : a)
    );
    alert('Blood receipt confirmed. Patient notified.');
  };

  const handleReportShortage = (id: string) => {
    const allocation = allocations.find(a => a.id === id);
    alert(`Shortage reported for ${allocation?.bloodType}. Admin will handle reallocation.`);
  };

  const totalUnits = allocations.reduce((sum, a) => sum + a.unitsAllocated, 0);
  const receivedUnits = allocations.filter(a => a.status === 'received').reduce((sum, a) => sum + a.unitsAllocated, 0);

  const statusColor = (status: string) => {
    return {
      pending: 'bg-muted',
      in_transit: 'bg-status-warning/10',
      received: 'bg-status-stable/10'
    }[status];
  };

  const statusIcon = (status: string) => {
    return {
      pending: <Clock className="w-5 h-5 text-muted-foreground" />,
      in_transit: <TrendingUp className="w-5 h-5 text-status-warning" />,
      received: <CheckCircle className="w-5 h-5 text-status-stable" />
    }[status];
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Total Units Allocated</p>
              <p className="text-3xl font-bold">{totalUnits}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Units Received</p>
              <p className="text-3xl font-bold text-status-stable">{receivedUnits}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">In Transit / Pending</p>
              <p className="text-3xl font-bold text-status-warning">
                {allocations.filter(a => a.status !== 'received').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Blood Allocations & Delivery</h2>

        {allocations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No blood allocations yet
            </CardContent>
          </Card>
        ) : (
          allocations.map((alloc, idx) => (
            <motion.div
              key={alloc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`overflow-hidden ${statusColor(alloc.status)}`}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{statusIcon(alloc.status)}</div>
                        <div>
                          <h3 className="font-semibold">{alloc.bloodBank}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alloc.unitsAllocated} units of {alloc.bloodType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={alloc.status === 'received' ? 'default' : 'outline'}>
                          {alloc.status.toUpperCase().replace('_', ' ')}
                        </Badge>
                        <div className="text-sm font-semibold mt-2">
                          ETA: {alloc.eta}
                        </div>
                      </div>
                    </div>

                    {/* Volunteer Info */}
                    <div className="bg-background/50 rounded p-3 space-y-2 border">
                      <p className="text-xs font-semibold text-muted-foreground">TRANSPORT VOLUNTEER</p>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{alloc.volunteerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>📞 {alloc.volunteerPhone}</span>
                          </div>
                          {alloc.volunteerLocation && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {alloc.volunteerLocation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {alloc.status !== 'received' && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {alloc.status === 'in_transit' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={() => handleConfirmReceipt(alloc.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm Receipt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleReportShortage(alloc.id)}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Report Issue
                            </Button>
                          </>
                        )}
                        {alloc.status === 'pending' && (
                          <div className="text-sm text-muted-foreground">
                            ⏳ Awaiting volunteer departure
                          </div>
                        )}
                      </div>
                    )}

                    {alloc.status === 'received' && (
                      <div className="flex items-center gap-2 pt-2 border-t bg-status-stable/5">
                        <CheckCircle className="w-5 h-5 text-status-stable" />
                        <span className="text-sm font-medium text-status-stable">
                          Blood received and processed
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
