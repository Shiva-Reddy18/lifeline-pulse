import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Download,
  Search,
  ChevronDown,
} from "lucide-react";

interface HistoryRecord {
  id: string;
  date: string;
  emergencyId: string;
  bloodGroup: string;
  units: number;
  patientName: string;
  status: "completed" | "in_progress" | "cancelled";
  hospitalAction: string;
}

export default function HistoryRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  // Mock historical data
  const records: HistoryRecord[] = [
    {
      id: "HIS-001",
      date: "2026-01-07 14:30",
      emergencyId: "EMERG-2026-001",
      bloodGroup: "O+",
      units: 2,
      patientName: "John Doe",
      status: "completed",
      hospitalAction: "Accepted & Delivered",
    },
    {
      id: "HIS-002",
      date: "2026-01-06 09:15",
      emergencyId: "EMERG-2026-002",
      bloodGroup: "A-",
      units: 1,
      patientName: "Jane Smith",
      status: "completed",
      hospitalAction: "Accepted & Delivered",
    },
    {
      id: "HIS-003",
      date: "2026-01-05 22:45",
      emergencyId: "EMERG-2026-003",
      bloodGroup: "B+",
      units: 3,
      patientName: "Michael Johnson",
      status: "completed",
      hospitalAction: "Accepted & Delivered",
    },
    {
      id: "HIS-004",
      date: "2026-01-04 16:20",
      emergencyId: "EMERG-2026-004",
      bloodGroup: "AB+",
      units: 2,
      patientName: "Sarah Williams",
      status: "cancelled",
      hospitalAction: "Rerouted to Another Hospital",
    },
    {
      id: "HIS-005",
      date: "2026-01-03 11:05",
      emergencyId: "EMERG-2026-005",
      bloodGroup: "O-",
      units: 4,
      patientName: "Robert Brown",
      status: "completed",
      hospitalAction: "Accepted & Delivered",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else if (status === "in_progress") {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-800">Cancelled</Badge>;
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.emergencyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">History & Records</h2>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Search</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Emergency ID / Patient name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full gap-2" variant="outline">
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Emergency Handling Records ({sortedRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Emergency ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Blood Group</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Units</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Hospital Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record, idx) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {record.date}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                          {record.emergencyId}
                        </code>
                      </td>
                      <td className="py-3 px-4">{record.patientName}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-red-600">{record.bloodGroup}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{record.units}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{record.hospitalAction}</td>
                      <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Total Emergencies</p>
            <p className="text-3xl font-bold mt-2">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Success Rate</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {Math.round(
                (records.filter((r) => r.status === "completed").length / records.length) * 100
              )}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Total Blood Units</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {records.reduce((sum, r) => sum + r.units, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">Avg Units/Emergency</p>
            <p className="text-3xl font-bold mt-2">
              {(records.reduce((sum, r) => sum + r.units, 0) / records.length).toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
