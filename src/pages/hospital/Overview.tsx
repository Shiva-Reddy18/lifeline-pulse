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
        {/* Visual Analytics */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 mb-3">Visual Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Requests (recent)</p>
                <div className="w-full h-24 bg-white p-2 rounded-md border border-border">
                  <Sparkline data={computeHourlyCounts(emergencies)} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Blood Stock Distribution</p>
                <div className="w-full h-24 bg-white p-2 rounded-md border border-border flex items-center justify-center">
                  <StockBars stock={hospitalStock} />
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

// Simple helper: compute counts per hour (last 12 buckets)
function computeHourlyCounts(emergencies: any[]) {
  const now = Date.now();
  const hourMs = 1000 * 60 * 60;
  const buckets = new Array(12).fill(0);
  emergencies.forEach((e) => {
    const t = new Date(e.created_at).getTime();
    const hoursAgo = Math.floor((now - t) / hourMs);
    if (hoursAgo >= 0 && hoursAgo < 12) buckets[11 - hoursAgo]++;
  });
  return buckets;
}

function Sparkline({ data }: { data: number[] }) {
  const width = 300;
  const height = 60;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`);
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="#0EA5A4" strokeWidth={2} points={points.join(" ")} />
    </svg>
  );
}

function StockBars({ stock }: { stock: any }) {
  if (!stock || typeof stock !== 'object') return <div className="text-sm text-muted-foreground">No stock data</div>;
  const entries = Object.entries(stock).slice(0, 6);
  const total = entries.reduce((s, [, v]) => s + Number(v || 0), 0) || 1;
  return (
    <div className="w-full flex items-center gap-2 px-2">
      {entries.map(([k, v]) => {
        const pct = Math.round((Number(v) / total) * 100);
        return (
          <div key={k} className="flex-1 text-center text-xs">
            <div className="h-6 bg-slate-100 rounded-md flex items-end">
              <div style={{ height: `${Math.round((Number(v) / total) * 100)}%` }} className="w-full bg-primary rounded-b-md"></div>
            </div>
            <div className="mt-1">{k} ({pct}%)</div>
          </div>
        );
      })}
    </div>
  );
}
