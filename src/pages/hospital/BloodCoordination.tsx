import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Phone,
  Mail,
  Droplet,
  Users,
  Hospital,
  X,
  Plus,
} from "lucide-react";

interface BloodBank {
  id: string;
  name: string;
  phone: string;
  email: string;
  available_units: Record<string, number>;
  distance?: string;
}

export default function BloodCoordination() {
  const [selectedBank, setSelectedBank] = useState<BloodBank | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch blood bank connections
  const { data: bloodBanks = [] } = useQuery({
    queryKey: ["blood-banks"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: "bb1",
          name: "Central Blood Bank",
          phone: "+1-555-0100",
          email: "contact@centralblood.org",
          available_units: { "O+": 25, "O-": 10, "A+": 15, "A-": 8, "B+": 12, "B-": 6, "AB+": 5, "AB-": 3 },
          distance: "2.5 km",
        },
        {
          id: "bb2",
          name: "Red Cross Blood Center",
          phone: "+1-555-0200",
          email: "info@redcrossblood.org",
          available_units: { "O+": 30, "O-": 12, "A+": 18, "A-": 10, "B+": 14, "B-": 7, "AB+": 6, "AB-": 4 },
          distance: "5.0 km",
        },
      ] as BloodBank[];
    },
  });

  // Fetch donor availability
  const { data: donorStats = { available: 45, on_duty: 12 } } = useQuery({
    queryKey: ["donor-availability"],
    queryFn: async () => {
      return { available: 45, on_duty: 12 };
    },
  });

  const handleContactBank = async () => {
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setSelectedBank(null);
      setContactMessage("");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Blood Coordination</h2>

      {/* Blood Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600" />
            Current Blood Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bloodType) => (
              <motion.div
                key={bloodType}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 border rounded-lg text-center hover:border-red-300 transition-colors"
              >
                <div className="text-2xl font-bold text-red-600">{bloodType}</div>
                <div className="text-xs text-muted-foreground mt-1">0 units</div>
                <div className="text-xs text-yellow-600 mt-1">Low Stock</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Donor Availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Available Donors</p>
                <p className="text-4xl font-bold mt-2">{donorStats.available}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">On Duty</p>
                <p className="text-4xl font-bold mt-2">{donorStats.on_duty}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Hospital className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blood Bank Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Blood Banks</span>
            <Badge>2 Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bloodBanks.map((bank) => (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{bank.name}</h3>
                    <p className="text-sm text-muted-foreground">{bank.distance} away</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${bank.phone}`} className="text-blue-600 hover:underline">{bank.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${bank.email}`} className="text-blue-600 hover:underline">{bank.email}</a>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {Object.entries(bank.available_units).slice(0, 4).map(([bloodType, units]) => (
                    <div key={bloodType} className="text-center p-2 bg-slate-50 rounded">
                      <div className="font-semibold text-red-600">{bloodType}</div>
                      <div className="text-xs text-muted-foreground">{units} units</div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => setSelectedBank(bank)}
                >
                  <Phone className="w-4 h-4" /> Contact Bank
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Bank Dialog */}
      <Dialog open={!!selectedBank} onOpenChange={(open) => { if (!open) setSelectedBank(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Blood Bank</DialogTitle>
          </DialogHeader>

          {selectedBank && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Bank: {selectedBank.name}</p>
                <p className="text-sm text-muted-foreground">{selectedBank.distance}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Message</label>
                <Input
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your blood requirement..."
                  className="mt-2"
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedBank(null)}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleContactBank} disabled={sending}>
                  {sending ? "Sending..." : <><Phone className="w-4 h-4" /> Send Message</>}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
