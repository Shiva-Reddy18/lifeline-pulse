/**
 * LIVE CASE TRACKING PAGE
 * Purpose: Track emergency fulfillment in real-time with GPS and timeline
 * 
 * Displays:
 * - Live map view showing hospital, blood source, transport vehicle locations
 * - Real-time GPS coordinates and ETA (estimated time of arrival)
 * - Case progress timeline:
 *   Request Raised → Hospital Validated → Admin Approved → 
 *   Blood Dispatched → Blood In Transit → Blood Received → 
 *   Transfusion Started → Case Closed
 * - Time spent at each stage
 * - Status updates and notes
 * - Communication history
 * 
 * Critical for:
 * - Time-sensitive emergency response
 * - Coordinator decision-making
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TimelineEvent {
  timestamp: string;
  status: string;
  description: string;
  actor: string;
  details?: string;
}

export default function LiveCaseTracking() {
  const [cases] = useState([
    {
      id: 'case-1',
      patientId: 'pat***45',
      condition: 'Trauma - Road Accident',
      bloodGroup: 'O-',
      status: 'ongoing',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      timeline: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Request Raised',
          description: 'Emergency blood request created',
          actor: 'Patient System',
          details: '3 units of O- blood'
        },
        {
          timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Hospital Validated',
          description: 'Medical requirement confirmed by hospital staff',
          actor: 'Dr. Sharma (Hospital)',
          details: 'Confirmed blood requirement, uploaded vitals'
        },
        {
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Admin Approved',
          description: 'Request approved by system admin',
          actor: 'Admin Panel',
          details: 'Verified hospital capacity and blood bank availability'
        },
        {
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Blood Dispatched',
          description: 'Blood units dispatched from blood bank',
          actor: 'Central Blood Bank',
          details: '3 units O- allocated to volunteer Rajesh Kumar'
        },
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toLocaleTimeString(),
          status: 'Blood Received',
          description: 'Blood units received at hospital',
          actor: 'Hospital Lab',
          details: 'All units processed and ready for transfusion'
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleTimeString(),
          status: 'Transfusion Started',
          description: 'Transfusion procedure initiated',
          actor: 'Medical Team',
          details: 'Patient vitals stable, transfusion ongoing'
        }
      ]
    },
    {
      id: 'case-2',
      patientId: 'pat***89',
      condition: 'Dengue - Platelet Required',
      bloodGroup: 'B+',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      timeline: [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Request Raised',
          description: 'Emergency platelet transfusion requested',
          actor: 'Patient System',
          details: '2 units of B+ blood'
        },
        {
          timestamp: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Hospital Validated',
          description: 'Medical requirement confirmed',
          actor: 'Dr. Patel (Hospital)',
          details: 'Platelet count critical, immediate transfusion needed'
        },
        {
          timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Admin Approved',
          description: 'Request approved',
          actor: 'Admin Panel',
          details: 'Emergency approved with priority'
        },
        {
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Blood Dispatched',
          description: 'Blood units dispatched',
          actor: 'Blood Bank',
          details: '2 units B+ sent with volunteer'
        },
        {
          timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Blood Received',
          description: 'Blood received at hospital',
          actor: 'Hospital Lab',
          details: 'All units ready for procedure'
        },
        {
          timestamp: new Date(Date.now() - 17 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Transfusion Started',
          description: 'Transfusion completed',
          actor: 'Medical Team',
          details: 'Patient recovered, platelet count normalized'
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString(),
          status: 'Case Closed',
          description: 'Emergency resolved, patient discharged',
          actor: 'Hospital',
          details: 'Patient stable, no further transfusion needed'
        }
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    return {
      'Request Raised': 'bg-muted',
      'Hospital Validated': 'bg-blue-50',
      'Admin Approved': 'bg-green-50',
      'Blood Dispatched': 'bg-yellow-50',
      'Blood Received': 'bg-blue-50',
      'Transfusion Started': 'bg-purple-50',
      'Case Closed': 'bg-green-50'
    }[status] || 'bg-muted';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'Request Raised': '📋',
      'Hospital Validated': '✓',
      'Admin Approved': '✅',
      'Blood Dispatched': '🚚',
      'Blood Received': '📦',
      'Transfusion Started': '💉',
      'Case Closed': '🏁'
    };
    return icons[status] || '•';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Live Case Tracking</h2>

      {cases.map((caseItem, caseIdx) => (
        <motion.div
          key={caseItem.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: caseIdx * 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Case {caseItem.id.split('-')[1]} • {caseItem.condition}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Patient: {caseItem.patientId} | Blood: {caseItem.bloodGroup}
                  </p>
                </div>
                <Badge variant={caseItem.status === 'completed' ? 'default' : 'warning'}>
                  {caseItem.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-1">
                {caseItem.timeline.map((event, eventIdx) => (
                  <div key={eventIdx} className={`p-4 rounded border-l-4 border-primary ${getStatusColor(event.status)}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl min-w-fit">{getStatusIcon(event.status)}</span>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-semibold">{event.status}</h4>
                          <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="font-medium">By {event.actor}</span>
                          {event.details && <span className="text-muted-foreground">• {event.details}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
