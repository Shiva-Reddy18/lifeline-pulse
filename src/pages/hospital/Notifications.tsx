import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trash2, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';

interface Notification { id: string; type: string; title: string; message: string; timestamp: Date; read: boolean; action?: string; }

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([/* sample notifications omitted */]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const handleMarkAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const handleDelete = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const handleMarkAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const getIcon = (type: string) => ({ emergency: <AlertTriangle className="w-5 h-5 text-status-critical" />, admin_decision: <CheckCircle className="w-5 h-5 text-status-stable" />, blood_arrival: <Bell className="w-5 h-5 text-status-stable" />, system_alert: <Info className="w-5 h-5 text-muted-foreground" /> } as any)[type];
  const getBgColor = (type: string, read: boolean) => read ? 'bg-background' : ({ emergency: 'bg-status-critical/5', admin_decision: 'bg-status-stable/5', blood_arrival: 'bg-status-stable/5', system_alert: 'bg-muted' } as any)[type];
  const getTypeLabel = (type: string) => ({ emergency: 'Emergency', admin_decision: 'Admin Decision', blood_arrival: 'Blood Arrival', system_alert: 'System Alert' } as any)[type];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications Center</h2>
          {unreadCount > 0 && (<p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>)}
        </div>
        {unreadCount > 0 && (<Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>Mark All as Read</Button>)}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm">All</Button>
        <Button variant="outline" size="sm">Emergencies</Button>
        <Button variant="outline" size="sm">Admin Decisions</Button>
        <Button variant="outline" size="sm">Blood Arrivals</Button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No notifications</CardContent></Card>
        ) : (
          notifications.map((notif, idx) => (
            <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className={`overflow-hidden transition-colors ${getBgColor(notif.type, notif.read)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{notif.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                          <div className="flex items-center gap-3 mt-3"><Badge variant="outline" className="text-xs">{getTypeLabel(notif.type)}</Badge><span className="text-xs text-muted-foreground">{notif.timestamp.toLocaleTimeString()}</span></div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {notif.action && <Button variant="outline" size="sm" className="whitespace-nowrap">{notif.action}</Button>}
                          {!notif.read && <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} className="text-xs">Mark as read</Button>}
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDelete(notif.id)}><Trash2 className="w-4 h-4" /></Button>
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
