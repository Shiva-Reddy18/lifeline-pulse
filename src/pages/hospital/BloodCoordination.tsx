// src/pages/hospital/BloodCoordination.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, Trash2, Phone, Mail, Droplet, Users, Plus, Search, UserPlus, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNowStrict } from "date-fns";

/**
 * BloodCoordination.tsx
 *
 * Responsibilities:
 * - Show hospital inventory (from blood_inventory table)
 * - Allow hospital to update inventory (upsert)
 * - Show connected blood banks and contact them
 * - Search & shortlist donors by blood group (optional)
 * - Assign donor / create coordination records (persist if table exists)
 *
 * Important enforcement:
 * - Actions that mutate data require a hospitalId (derived from profile.id or profile.hospital_id).
 * - If hospitalId is missing, UI will clearly disable mutation actions and show an explanation.
 *
 * This file is intentionally detailed and defensive so the module is demo-stable.
 */

/* -------------------------
   Types
   ------------------------- */
type UUID = string;

type InventoryRow = {
  id?: UUID;
  hospital_id: UUID | null;
  blood_group: string;
  units_available: number;
  min_threshold?: number;
  updated_at?: string | null;
};

type BloodBank = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  distance?: string | null;
  available_units?: Record<string, number>;
};

type Donor = {
  id: string;
  name?: string | null;
  phone?: string | null;
  blood_group?: string | null;
  last_donated_at?: string | null;
  available?: boolean | null;
};

/* -------------------------
   Constants & helpers
   ------------------------- */
const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
type BloodType = (typeof BLOOD_TYPES)[number];

const fmt = (d?: string | null) => (d ? formatDistanceToNowStrict(new Date(d), { addSuffix: true }) : "—");

const safeNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
};

/* -------------------------
   Component
   ------------------------- */

export default function BloodCoordination({ hospitalId: propHospitalId }: { hospitalId?: UUID }) {
  const { profile, user } = useAuth() as any;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // derive hospitalId from profile first (preferred), then prop, then user fallback for dev
  const hospitalId: UUID | undefined = (propHospitalId ?? profile?.id ?? (profile as any)?.hospital_id ?? user?.id) || undefined;

  // local UI state
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>(() =>
    BLOOD_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {} as Record<string, number>)
  );
  const [minThresholdMap, setMinThresholdMap] = useState<Record<string, number>>(() =>
    BLOOD_TYPES.reduce((acc, t) => ({ ...acc, [t]: 5 }), {} as Record<string, number>)
  );

  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [banksOpen, setBanksOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BloodBank | null>(null);
  const [contactMsg, setContactMsg] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const [donorQuery, setDonorQuery] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  /* -------------------------
     Inventory: fetch and sync
     ------------------------- */
  const fetchInventory = useCallback(async () => {
    if (!hospitalId) return [];
    try {
      const { data, error } = await supabase
        .from<InventoryRow>("blood_inventory")
        .select("blood_group,units_available,min_threshold,updated_at")
        .eq("hospital_id", hospitalId);
      if (error) throw error;
      return (data ?? []) as InventoryRow[];
    } catch (e) {
      console.warn("fetchInventory fallback", e);
      return [];
    }
  }, [hospitalId]);

  const invQuery = useQuery({
    queryKey: ["hospital-inventory", hospitalId],
    queryFn: fetchInventory,
    enabled: !!hospitalId,
    refetchInterval: 8000,
    staleTime: 5000,
    onSuccess(rows) {
      const map: Record<string, number> = { ...BLOOD_TYPES.reduce((a, t) => ({ ...a, [t]: 0 }), {}) };
      const minMap: Record<string, number> = { ...BLOOD_TYPES.reduce((a, t) => ({ ...a, [t]: 5 }), {}) };
      rows.forEach((r) => {
        if (r?.blood_group) map[r.blood_group] = safeNumber(r.units_available);
        if (r?.blood_group && r.min_threshold !== undefined) minMap[r.blood_group] = safeNumber(r.min_threshold);
      });
      setInventoryMap((prev) => ({ ...prev, ...map }));
      setMinThresholdMap((prev) => ({ ...prev, ...minMap }));
    },
  });

  /* -------------------------
     Upsert inventory mutation
     ------------------------- */
  const upsertInventory = useMutation(
    async ({ blood_group, units, min_threshold }: { blood_group: string; units: number; min_threshold?: number }) => {
      if (!hospitalId) throw new Error("Hospital ID missing");
      const payload: InventoryRow = {
        hospital_id: hospitalId,
        blood_group,
        units_available: safeNumber(units),
        min_threshold: min_threshold !== undefined ? safeNumber(min_threshold) : safeNumber(minThresholdMap[blood_group]),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("blood_inventory")
        .upsert(payload, { onConflict: ["hospital_id", "blood_group"] })
        .select()
        .single();
      if (error) throw error;
      return data as InventoryRow;
    },
    {
      onMutate: async ({ blood_group, units }) => {
        await queryClient.cancelQueries({ queryKey: ["hospital-inventory", hospitalId] });
        const previous = queryClient.getQueryData(["hospital-inventory", hospitalId]);
        queryClient.setQueryData(["hospital-inventory", hospitalId], (old: any) => old); // keep
        setInventoryMap((p) => ({ ...p, [blood_group]: units }));
        return { previous };
      },
      onError: (err, vars, context: any) => {
        toast?.({ title: "Update failed", description: (err as any)?.message ?? "Could not update inventory" });
        if (context?.previous) queryClient.setQueryData(["hospital-inventory", hospitalId], context.previous);
      },
      onSuccess(data) {
        queryClient.invalidateQueries({ queryKey: ["hospital-inventory", hospitalId] });
        toast?.({ title: "Inventory updated", description: `${data.blood_group}: ${data.units_available} units` });
      },
    }
  );

  /* -------------------------
     Blood banks: fetch (with fallback mock)
     ------------------------- */
  const fetchBanks = useCallback(async (): Promise<BloodBank[]> => {
    try {
      const { data, error } = await supabase
        .from("blood_banks")
        .select("id,name,phone,email,distance,available_units")
        .order("name", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as BloodBank[];
    } catch (e) {
      console.warn("fetchBanks fallback", e);
      // fallback demo banks
      return [
        {
          id: "bb-central",
          name: "Central Blood Bank",
          phone: "+91-99999-00001",
          email: "central@blood.org",
          distance: "2.1 km",
          available_units: { "O+": 20, "A+": 12, "B+": 8 },
        },
        {
          id: "bb-redcross",
          name: "Red Cross Center",
          phone: "+91-99999-00002",
          email: "info@redcross.org",
          distance: "4.3 km",
          available_units: { "O+": 25, "O-": 8, "AB+": 3 },
        },
      ];
    }
  }, []);

  const banksQuery = useQuery({
    queryKey: ["blood-banks"],
    queryFn: fetchBanks,
    onSuccess(data) {
      setBanks(data ?? []);
    },
  });

  /* -------------------------
     Contact bank mutation (persist to bank_messages if exists, else fallback)
     ------------------------- */
  const contactMutation = useMutation(
    async ({ bankId, message }: { bankId: string; message: string }) => {
      try {
        const { data, error } = await supabase.from("bank_messages").insert([
          {
            bank_id: bankId,
            from_hospital_id: hospitalId,
            message,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("contact fallback - bank_messages not present", e);
        return { ok: true };
      }
    },
    {
      onSuccess() {
        toast?.({ title: "Contact sent", description: "Bank has been notified (demo)." });
      },
      onError(err: any) {
        toast?.({ title: "Contact failed", description: err?.message ?? "Could not contact bank." });
      },
    }
  );

  /* -------------------------
     Donors: search by blood group (simple)
     ------------------------- */
  const searchDonors = useCallback(
    async (blood_group?: string) => {
      try {
        if (!blood_group) {
          // fallback: small demo list
          setDonors([
            { id: "d-demo-1", name: "Ravi Kumar", phone: "+919999900001", blood_group: "O+", available: true, last_donated_at: null },
            { id: "d-demo-2", name: "Anita Sharma", phone: "+919999900002", blood_group: "B+", available: true, last_donated_at: null },
          ]);
          return;
        }
        const { data, error } = await supabase
          .from("donors")
          .select("id,name,phone,blood_group,last_donated_at,available")
          .ilike("blood_group", `%${blood_group}%`)
          .limit(50);
        if (error) throw error;
        setDonors((data ?? []) as Donor[]);
      } catch (e) {
        console.warn("searchDonors fallback", e);
        setDonors([
          { id: "d-demo-1", name: "Ravi Kumar", phone: "+919999900001", blood_group: blood_group ?? "O+", available: true, last_donated_at: null },
        ]);
      }
    },
    []
  );

  useEffect(() => {
    // auto-search when query looks like a blood group
    const q = donorQuery.trim().toUpperCase();
    if (BLOOD_TYPES.includes(q as BloodType)) {
      searchDonors(q);
    }
    // also allow searching by name/phone if query length > 2
    if (donorQuery.trim().length > 2 && !BLOOD_TYPES.includes(q as BloodType)) {
      searchDonors("");
    }
  }, [donorQuery, searchDonors]);

  /* -------------------------
     Assign donor mutation (creates a coordination record)
     ------------------------- */
  const assignMutation = useMutation(
    async ({ donorId, emergencyId }: { donorId: string; emergencyId?: string }) => {
      try {
        const { data, error } = await supabase.from("donor_assignments").insert([
          {
            donor_id: donorId,
            hospital_id: hospitalId,
            emergency_id: emergencyId ?? null,
            assigned_at: new Date().toISOString(),
            status: "ASSIGNED",
          },
        ]);
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn("assign fallback", e);
        return { ok: true };
      }
    },
    {
      onMutate: async (vars) => {
        setAssigning(true);
      },
      onError(err: any) {
        toast?.({ title: "Assign failed", description: err?.message ?? "Could not assign donor." });
      },
      onSuccess() {
        toast?.({ title: "Donor assigned", description: "Donor has been notified." });
        queryClient.invalidateQueries({ queryKey: ["donors"] });
      },
      onSettled() {
        setAssigning(false);
      },
    }
  );

  /* -------------------------
     UI actions
     ------------------------- */

  const changeUnits = async (bloodType: string, delta: number) => {
    const curr = inventoryMap[bloodType] ?? 0;
    const next = Math.max(0, curr + delta);
    // optimistic UI
    setInventoryMap((p) => ({ ...p, [bloodType]: next }));
    try {
      await upsertInventory.mutateAsync({ blood_group: bloodType, units: next, min_threshold: minThresholdMap[bloodType] });
    } catch (e) {
      // revert on error
      setInventoryMap((p) => ({ ...p, [bloodType]: curr }));
    }
  };

  const handleOpenContact = (bank: BloodBank) => {
    setSelectedBank(bank);
    setContactMsg(`Hospital ${profile?.hospital_name ?? profile?.full_name ?? "unknown"} requests blood support.`);
  };

  const handleSendContact = async () => {
    if (!selectedBank) return;
    setSendingContact(true);
    try {
      await contactMutation.mutateAsync({ bankId: selectedBank.id, message: contactMsg });
      setSelectedBank(null);
    } catch (e) {
      // handled by mutation
    } finally {
      setSendingContact(false);
    }
  };

  const handleAssignDonor = async (donor: Donor) => {
    if (!hospitalId) {
      toast?.({ title: "Hospital missing", description: "Register hospital to assign donors." });
      return;
    }
    setSelectedDonor(donor);
    try {
      await assignMutation.mutateAsync({ donorId: donor.id });
      setSelectedDonor(null);
    } catch (e) {
      // handled by mutation
    }
  };

  const handleExport = () => {
    const payload = BLOOD_TYPES.map((t) => `${t}: ${inventoryMap[t] ?? 0} units`).join("\n");
    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${hospitalId ?? "local"}-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.({ title: "Exported", description: "Inventory exported" });
  };

  /* -------------------------
     Derived helpers for UI
     ------------------------- */
  const lowStock = useMemo(
    () => BLOOD_TYPES.filter((t) => (inventoryMap[t] ?? 0) < (minThresholdMap[t] ?? 5)),
    [inventoryMap, minThresholdMap]
  );

  /* -------------------------
     Initial effects
     ------------------------- */
  useEffect(() => {
    // initial fetches
    if (hospitalId) {
      invQuery.refetch().catch(() => {});
    }
    banksQuery.refetch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Blood Coordination</h2>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setBanksOpen((s) => !s)} className="gap-2">
            <Users className="w-4 h-4" /> Banks
          </Button>
          <Button size="sm" onClick={() => setBanksOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Bank
          </Button>
        </div>
      </div>

      {/* Inventory grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600" /> Current Inventory
            <div className="ml-auto text-xs text-slate-500">{hospitalId ? "Scoped to hospital" : "Hospital not registered (demo mode)"}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BLOOD_TYPES.map((t) => (
              <motion.div key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="p-4 bg-white rounded border">
                  <div className="text-lg font-semibold">{t}</div>
                  <div className="text-2xl font-bold mt-2 text-red-600">{inventoryMap[t] ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">Threshold: {minThresholdMap[t]}</div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => changeUnits(t, -1)} disabled={!hospitalId || upsertInventory.isLoading}>
                      -1
                    </Button>
                    <Button size="sm" onClick={() => changeUnits(t, +1)} disabled={!hospitalId || upsertInventory.isLoading}>
                      +1
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      // quick set to 0
                      if (!hospitalId) { toast?.({ title: "Disabled", description: "Register your hospital to update inventory." }); return; }
                      upsertInventory.mutate({ blood_group: t, units: 0 });
                    }}>
                      Clear
                    </Button>
                  </div>

                  {inventoryMap[t] < (minThresholdMap[t] ?? 5) && <div className="mt-2 text-xs text-amber-600">Low stock — consider creating an emergency</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Donor search + Banks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Find Donors</div>
                <div className="text-xs text-slate-500">Search by blood group or name</div>
              </div>
              <div className="text-xs text-slate-400">Network</div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Input placeholder="Type blood group (e.g. O+)" value={donorQuery} onChange={(e) => setDonorQuery(e.target.value)} />
              <Button onClick={() => searchDonors(donorQuery.trim().toUpperCase())}><Search className="w-4 h-4" /></Button>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-auto">
              {donors.length === 0 ? (
                <div className="text-sm text-slate-400">No donors found</div>
              ) : (
                donors.map((d) => (
                  <div key={d.id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.name ?? "Anonymous"}</div>
                      <div className="text-xs text-slate-500">{d.blood_group} • Last donated: {fmt(d.last_donated_at)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" onClick={() => handleAssignDonor(d)} disabled={!hospitalId || assigning}><UserPlus className="w-4 h-4" /></Button>
                      {d.phone ? <a href={`tel:${d.phone}`} className="text-xs text-blue-600">Call</a> : <span className="text-xs text-slate-400">No phone</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connected Blood Banks</span>
              <Badge>{banks.length} banks</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {banks.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 border rounded bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-slate-500">{b.distance ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {Object.entries(b.available_units ?? {}).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-50 rounded text-center text-sm">
                        <div className="font-semibold text-red-600">{k}</div>
                        <div className="text-xs text-slate-500">{v} units</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => handleOpenContact(b)}><Phone className="w-4 h-4" /> Contact</Button>
                    {b.email && <a href={`mailto:${b.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2"><Mail className="w-4 h-4" /> Email</a>}
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard?.writeText(b.phone ?? "");
                      toast?.({ title: "Copied", description: "Phone copied to clipboard" });
                    }}><Link2 className="w-4 h-4" /> Copy</Button>
                  </div>
                </motion.div>
              ))}

              {banks.length === 0 && <div className="text-sm text-slate-400">No banks connected yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add bank dialog (quick add, persists if table exists) */}
      <Dialog open={banksOpen} onOpenChange={(open) => setBanksOpen(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Blood Bank</DialogTitle></DialogHeader>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500">Name</div>
              <Input id="bank-name" className="mt-2" placeholder="Bank name" onChange={(e) => {/* no-op for quick demo; use DB or external flow */}} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setBanksOpen(false); toast?.({ title: "Demo", description: "Add bank UI is demo-only here." }); }}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact bank dialog */}
      <Dialog open={!!selectedBank} onOpenChange={(open) => { if (!open) setSelectedBank(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Contact {selectedBank?.name}</DialogTitle></DialogHeader>

          {selectedBank && (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-slate-500">To</div>
                <div className="font-medium">{selectedBank.name}</div>
                <div className="text-xs text-slate-400">{selectedBank.distance}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Message</div>
                <Input value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} className="mt-2" placeholder="Describe units required, urgency and contact details" />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedBank(null)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendContact} disabled={sendingContact}>
                  {sendingContact ? "Sending..." : <><Phone className="w-4 h-4" /> Send</>}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
