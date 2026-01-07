import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  X,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  type: "emergency" | "approval" | "rejection" | "delivery" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "notif-1",
      type: "emergency",
      title: "New Emergency Request",
      message: "Patient John Doe (O+ blood) requires urgent blood transfusion at address 123 Main St",
      timestamp: "5 mins ago",
      read: false,
      actionUrl: "/hospital/emergencies",
    },
    {
      id: "notif-2",
      type: "approval",
      title: "Admin Approved Request",
      message: "Your acceptance for emergency EMERG-2026-001 has been verified by admin",
      timestamp: "12 mins ago",
      read: false,
    },
    {
      id: "notif-3",
      type: "delivery",
      title: "Blood Delivery Confirmed",
      message: "2 units of O+ successfully delivered to patient. Transaction ID: TXN-2026-123",
      timestamp: "1 hour ago",
      read: true,
    },
    {
      id: "notif-4",
      type: "alert",
      title: "Low Blood Stock Alert",
      message: "Hospital inventory for AB- blood type is running low. Consider contacting blood banks.",
      timestamp: "3 hours ago",
      read: true,
    },
    {
      id: "notif-5",
      type: "emergency",
      title: "Urgent: Critical Patient",
      message: "Patient Sarah Williams (AB+ blood) requires emergency blood units. CRITICAL severity.",
      timestamp: "6 hours ago",
      read: true,
      actionUrl: "/hospital/emergencies",
    },
    {
      id: "notif-6",
      type: "rejection",
      title: "Request Could Not Be Fulfilled",
      message: "Emergency EMERG-2026-004 was rerouted to another hospital due to insufficient stock",
      timestamp: "1 day ago",
      read: true,
    },
  ]);

  const [filter, setFilter] = useState<string>("all");

  const getNotificationIcon = (type: string) => {
    if (type === "emergency") return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (type === "approval") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (type === "rejection") return <X className="w-4 h-4 text-orange-600" />;
    if (type === "delivery") return <CheckCircle className="w-4 h-4 text-blue-600" />;
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getNotificationBg = (type: string) => {
    if (type === "emergency") return "bg-red-50 border-red-200";
    if (type === "approval") return "bg-green-50 border-green-200";
    if (type === "rejection") return "bg-orange-50 border-orange-200";
    if (type === "delivery") return "bg-blue-50 border-blue-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        {unreadCount > 0 && (
          <Badge className="bg-red-600">{unreadCount} Unread</Badge>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All", value: "all" },
          { label: "Unread", value: "unread" },
          { label: "Emergencies", value: "emergency" },
          { label: "Approvals", value: "approval" },
          { label: "Deliveries", value: "delivery" },
        ].map(({ label, value }) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
            className="gap-2"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No notifications in this category
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  getNotificationBg(notif.type)
                } ${!notif.read ? "border-2" : ""}`}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  if (notif.actionUrl) {
                    // Navigate to actionUrl
                    window.location.href = notif.actionUrl;
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getNotificationIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.read && (
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {notif.actionUrl && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = notif.actionUrl || "";
                    }}
                  >
                    View Details
                  </Button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total", count: notifications.length },
              { label: "Unread", count: unreadCount },
              { label: "Emergencies", count: notifications.filter((n) => n.type === "emergency").length },
              { label: "Approvals", count: notifications.filter((n) => n.type === "approval").length },
              { label: "Deliveries", count: notifications.filter((n) => n.type === "delivery").length },
            ].map(({ label, count }) => (
              <div key={label} className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground uppercase">{label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
