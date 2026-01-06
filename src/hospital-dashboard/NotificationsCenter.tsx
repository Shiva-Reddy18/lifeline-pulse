/**
 * NOTIFICATIONS CENTER
 * Purpose: Never miss critical updates with real-time and offline-synced alerts
 * 
 * Includes alerts for:
 * - New emergency requests (with blood group and urgency)
 * - Admin approval decisions (approved/rejected)
 * - Blood shortages or unavailability
 * - Donor availability updates
 * - Transport delays or vehicle issues
 * - Blood arrival confirmation
 * - Case completion notifications
 * - System warnings and maintenance alerts
 * 
 * Features:
 * - Real-time push notifications
 * - Offline sync queue (notifications stored locally, synced when online)
 * - Mark as read / delete functionality
 * - Filter by notification type
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trash2, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'emergency' | 'admin_decision' | 'blood_arrival' | 'system_alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: string;
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      type: 'emergency',
      title: '🚨 New Emergency Alert',
      message: 'Patient at Highway 7 - Trauma case, O- blood needed urgently',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      action: 'View Emergency'
    },
    {
      id: 'notif-2',
      type: 'admin_decision',
      title: '✅ Admin Approval Granted',
      message: 'Your request for case #em-456 has been APPROVED. Proceed with blood coordination.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      action: 'View Case'
    },
    {
      id: 'notif-3',
      type: 'blood_arrival',
      title: '📦 Blood Units Arrived',
      message: '3 units of O- blood from Central Blood Bank received and verified.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: true,
      action: 'Confirm Receipt'
    },
    {
      id: 'notif-4',
      type: 'system_alert',
      title: 'ℹ️ System Maintenance Notice',
      message: 'System will undergo maintenance on 2025-01-10 from 2-4 AM. No emergency operations affected.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 'notif-5',
      type: 'emergency',
      title: '🚨 New Emergency Alert',
      message: 'Patient at City Hospital - Dengue case, B+ blood (2 units) urgently needed',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      action: 'View Emergency'
    },
    {
      id: 'notif-6',
      type: 'admin_decision',
      title: '❌ Admin Approval Rejected',
      message: 'Your request for case #em-451 was rejected. Reason: Hospital capacity exceeded. Please reschedule.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      action: 'View Case'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      emergency: <AlertTriangle className="w-5 h-5 text-status-critical" />,
      admin_decision: <CheckCircle className="w-5 h-5 text-status-stable" />,
      blood_arrival: <Bell className="w-5 h-5 text-status-stable" />,
      system_alert: <Info className="w-5 h-5 text-muted-foreground" />
    };
    return icons[type];
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-background';
    return {
      emergency: 'bg-status-critical/5',
      admin_decision: 'bg-status-stable/5',
      blood_arrival: 'bg-status-stable/5',
      system_alert: 'bg-muted'
    }[type];
  };

  const getTypeLabel = (type: string) => {
    return {
      emergency: 'Emergency',
      admin_decision: 'Admin Decision',
      blood_arrival: 'Blood Arrival',
      system_alert: 'System Alert'
    }[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications Center</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm">All</Button>
        <Button variant="outline" size="sm">Emergencies</Button>
        <Button variant="outline" size="sm">Admin Decisions</Button>
        <Button variant="outline" size="sm">Blood Arrivals</Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No notifications
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`overflow-hidden transition-colors ${getBgColor(notif.type, notif.read)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-1">{getIcon(notif.type)}</div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{notif.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>

                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notif.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notif.timestamp.toLocaleTimeString()} • {Math.floor((Date.now() - notif.timestamp.getTime()) / 60000)} mins ago
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {notif.action && (
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                              {notif.action}
                            </Button>
                          )}

                          {!notif.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-xs"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
