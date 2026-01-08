import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import getBloodBankUnitsByEmailAndName, { watchBloodBankUnitsByEmailAndName } from "@/lib/supabaseHelpers";
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

  const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    return bloodTypes.reduce((acc, t) => ({ ...acc, [t]: 0 }), {} as Record<string, number>);
  });

  const { profile } = useAuth();
  const hospitalId = profile?.id ?? null;

  // Fetch blood bank connections (mocked via react-query) and keep local state for additions
  const { data: bloodBanks = [] } = useQuery({
    queryKey: ["blood-banks"],
    queryFn: async () => {
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

  const [bloodBanksState, setBloodBanksState] = useState<BloodBank[]>([]);
  useEffect(() => {
    setBloodBanksState(bloodBanks as BloodBank[]);
  }, [bloodBanks]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankPhone, setNewBankPhone] = useState("");
  const [newBankEmail, setNewBankEmail] = useState("");
  const [newBankDistance, setNewBankDistance] = useState("");

  // Fetch donor availability from Supabase donors table
  const { data: donorStats = { available: 0 }, isLoading: donorLoading } = useQuery({
    queryKey: ["donor-availability"],
    queryFn: async () => {
      try {
        const { data: donors, error } = await supabase.from("donors").select("id");
        if (error) throw error;
        return { available: donors?.length || 0 };
      } catch (e) {
        console.error("Error fetching donors:", e);
        return { available: 0 };
      }
    },
  });

  // Fetch persisted inventory for this hospital (if hospitalId is available)
  useEffect(() => {
    let mounted = true;
    const fetchInventory = async () => {
      if (!hospitalId) return;
      try {
        const { data, error } = await supabase
          .from("blood_inventory")
          .select("blood_type, units")
          .eq("hospital_id", hospitalId);
        if (error) throw error;
        const map: Record<string, number> = { ...inventory };
        (data || []).forEach((row: any) => {
          map[row.blood_type] = row.units;
        });
        if (mounted) setInventory(map);
      } catch (e) {
        console.error("Error fetching inventory:", e);
      }
    };
    fetchInventory();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  // If a specific blood bank owner/email is provided, fetch their stock and watch for updates.
  useEffect(() => {
    // Example record provided by user
    const ownerEmail = 'Maheshbabu@gmail.com';
    const ownerName = 'Shiva Reddy';

    let stop: (() => void) | null = null;

    (async () => {
      const bank = await getBloodBankUnitsByEmailAndName(ownerEmail, ownerName);
      if (bank) {
        // Map stock to inventory state (use keys that match our bloodTypes)
        const map: Record<string, number> = { ...inventory };
        Object.entries(bank.stock || {}).forEach(([k, v]) => {
          map[k] = typeof v === 'number' ? v : Number(v || 0);
        });
        setInventory(map);

        // Start polling watcher to keep values reflected "every time"
        stop = watchBloodBankUnitsByEmailAndName(ownerEmail, ownerName, (res) => {
          if (!res) return;
          const next: Record<string, number> = { ...inventory };
          Object.entries(res.stock || {}).forEach(([k, v]) => {
            next[k] = typeof v === 'number' ? v : Number(v || 0);
          });
          setInventory(next);
        }, 5000);
      }
    })();

    return () => {
      if (stop) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsertInventory = async (bloodType: string, units: number) => {
    if (!hospitalId) return;
    try {
      const payload = { hospital_id: hospitalId, blood_type: bloodType, units };
      const { error } = await supabase.from("blood_inventory").upsert(payload, { onConflict: ["hospital_id", "blood_type"] });
      if (error) throw error;
    } catch (e) {
      console.error("Error upserting inventory:", e);
    }
  };

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
            {bloodTypes.map((bloodType) => (
              <motion.div
                key={bloodType}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 border rounded-lg text-center hover:border-red-300 transition-colors"
              >
                <div className="text-2xl font-bold text-red-600">{bloodType}</div>
                <div className="flex flex-col items-center justify-center gap-2 mt-2">
                  <div className="text-sm text-muted-foreground">{inventory[bloodType]} units</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        const newVal = Math.max(0, (inventory[bloodType] || 0) - 1);
                        setInventory((prev) => ({ ...prev, [bloodType]: newVal }));
                        await upsertInventory(bloodType, newVal);
                      }}
                    >
                      Reduce Unit
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const newVal = (inventory[bloodType] || 0) + 1;
                        setInventory((prev) => ({ ...prev, [bloodType]: newVal }));
                        await upsertInventory(bloodType, newVal);
                      }}
                    >
                      Add Unit
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-yellow-600 mt-2">{inventory[bloodType] < 5 ? "Low Stock" : ""}</div>
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
      </div>

      {/* Blood Bank Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connected Blood Banks</span>
            <div className="flex items-center gap-2">
              <Badge>{bloodBanksState.length} Active</Badge>
              <Button size="sm" onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Add Blood Bank
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bloodBanksState.map((bank) => (
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

      {/* Add Blood Bank Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => setAddDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Blood Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <Input value={newBankName} onChange={(e) => setNewBankName(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <Input value={newBankPhone} onChange={(e) => setNewBankPhone(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={newBankEmail} onChange={(e) => setNewBankEmail(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Distance</label>
              <Input value={newBankDistance} onChange={(e) => setNewBankDistance(e.target.value)} className="mt-2" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const id = `bb-${Date.now()}`;
                  const newBank: BloodBank = {
                    id,
                    name: newBankName || "New Blood Bank",
                    phone: newBankPhone || "",
                    email: newBankEmail || "",
                    distance: newBankDistance || "",
                    available_units: { "O+": 0, "O-": 0, "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0 },
                  };
                  setBloodBanksState((prev) => [newBank, ...prev]);
                  setAddDialogOpen(false);
                  setNewBankName("");
                  setNewBankPhone("");
                  setNewBankEmail("");
                  setNewBankDistance("");
                }}
              >
                Add Bank
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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
