import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Activity,
  Users,
  Droplet,
  TrendingUp,
  Clock,
} from "lucide-react";

interface HospitalStats {
  pendingRequests: number;
  activeRequests: number;
  totalDonorsConnected: number;
  bloodUnitsAvailable: number;
}

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hospitalId = user?.id ?? null;
  const [stats, setStats] = useState<HospitalStats>({
    pendingRequests: 0,
    activeRequests: 0,
    totalDonorsConnected: 0,
    bloodUnitsAvailable: 0,
  });

  // Fetch pending emergencies
  const { data: emergencies = [] } = useQuery({
    queryKey: ["emergencies", "created"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_requests")
        .select("*")
        .eq("status", "created")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any[];
    },
    refetchInterval: 10000,
  });

  // Fetch active emergencies
  const { data: activeEmergencies = [] } = useQuery({
    queryKey: ["emergencies", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_requests")
        .select("*")
        .eq("status", "hospital_accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any[];
    },
    refetchInterval: 10000,
  });

    // Fetch total donors (count from donors table)
    const { data: donorsCount = 0 } = useQuery({
      queryKey: ["donors", "count"],
      queryFn: async () => {
        const { data, count, error } = await supabase
          .from("donors")
          .select("id", { count: "exact" });
        if (error) throw error;
        return count ?? 0;
      },
      refetchInterval: 60000,
    });

    // Fetch hospital blood stock (sum values in hospitals.blood_stock)
    const { data: hospitalStock = null } = useQuery({
      queryKey: ["hospitals", hospitalId, "stock"],
      queryFn: async () => {
        if (!hospitalId) return null;
        const { data, error } = await supabase
          .from("hospitals")
          .select("blood_stock")
          .eq("id", hospitalId)
          .single();
        if (error) throw error;
        return data?.blood_stock ?? null;
      },
      enabled: !!hospitalId,
      refetchInterval: 60000,
    });

  // Update stats when data changes
  useEffect(() => {
    const bloodUnitsAvailable = (() => {
      if (!hospitalStock) return 0;
      try {
        if (typeof hospitalStock === "object") {
          return Object.values(hospitalStock as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0);
        }
        return 0;
      } catch {
        return 0;
      }
    })();

    setStats((prev) => ({
      ...prev,
      pendingRequests: emergencies.length,
      activeRequests: activeEmergencies.length,
      totalDonorsConnected: Number(donorsCount ?? 0),
      bloodUnitsAvailable: bloodUnitsAvailable,
    }));
  }, [emergencies, activeEmergencies, donorsCount, hospitalStock]);

  const statCards = [
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: AlertTriangle,
      color: "orange",
      delay: 0,
    },
    {
      title: "Active Cases",
      value: stats.activeRequests,
      icon: Activity,
      color: "red",
      delay: 0.1,
    },
    {
      title: "Registered Donors",
      value: stats.totalDonorsConnected,
      icon: Users,
      color: "blue",
      delay: 0.2,
    },
    {
      title: "Available Blood Units",
      value: stats.bloodUnitsAvailable,
      icon: Droplet,
      color: "red",
      delay: 0.3,
    },
  ];

  const colorMap = {
    orange: { bg: "bg-orange-100", icon: "text-orange-600" },
    red: { bg: "bg-red-100", icon: "text-red-600" },
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    green: { bg: "bg-green-100", icon: "text-green-600" },
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ title, value, icon: Icon, color, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
              onClick={() => {
                if (title === "Pending Requests") navigate("/hospital/emergencies");
              }}
              className={title === "Pending Requests" ? "cursor-pointer" : undefined}
              role={title === "Pending Requests" ? "button" : undefined}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {title}
                      </p>
                      <p className="text-4xl font-bold mt-2">{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${colorMap[color as keyof typeof colorMap].bg}`}>
                      <Icon className={`w-5 h-5 ${colorMap[color as keyof typeof colorMap].icon}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Emergency Response</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <Badge>12 mins</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">24h Acceptance Rate</span>
                  <Badge className="bg-green-100 text-green-800">94%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Blood Match Success</span>
                  <Badge className="bg-blue-100 text-blue-800">98%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>

      {/* Recent Activity */}

    </div>
  );
}
