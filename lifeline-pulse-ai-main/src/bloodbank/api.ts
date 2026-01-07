import { supabase } from "@/integrations/supabase/client";

/* ===================== TYPES ===================== */

export type InventoryRow = {
  id: string;
  blood_group: string;
  units_available: number;
  minimum_required?: number | null;
  status?: string | null;
  nearest_expiry?: string | null;
  storage_location?: string | null;
  updated_at?: string | null;
};

export type RequestRow = {
  id: string;
  hospital_name: string;
  blood_group: string;
  units_requested: number;
  urgency: string;
  priority_score?: number | null;
  status: string;
  requested_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  remarks?: string | null;
};

export type DispatchRow = {
  id: string;
  request_id: string;
  blood_group: string;
  units_dispatched: number;
  dispatch_time?: string | null;
  delivery_status?: string | null;
  vehicle_id?: string | null;
  driver_name?: string | null;
  received_by?: string | null;
};

export type DonorRow = {
  id: string;
  name: string;
  blood_group: string;
  last_donation_date?: string | null;
  next_eligible_date?: string | null;
  hemoglobin_level?: number | null;
  location?: string | null;
  is_available?: boolean | null;
};

export type DailyStatsRow = {
  date: string;
  total_units: number;
  requests_received: number;
  requests_fulfilled: number;
  critical_alerts: number;
  units_wasted: number;
};

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  last_login?: string | null;
  is_active?: boolean | null;
};

/* ===================== FETCH (FAST & SAFE) ===================== */

export async function fetchInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from("blood_inventory")
    .select("*")
    .order("blood_group");

  if (error) throw error;
  return data ?? [];
}

export async function fetchRequests(): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchDispatchLog(): Promise<DispatchRow[]> {
  const { data, error } = await supabase
    .from("blood_dispatch_log")
    .select("*")
    .order("dispatch_time", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function fetchDonors(): Promise<DonorRow[]> {
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .order("name")
    .limit(200);

  if (error) throw error;
  return data ?? [];
}

export async function fetchDailyStats(limit = 30): Promise<DailyStatsRow[]> {
  const { data, error } = await supabase
    .from("bloodbank_daily_stats")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchStaff(): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from("bloodbank_staff")
    .select("*")
    .order("name")
    .limit(200);

  if (error) throw error;
  return data ?? [];
}

/* ===================== WRITE (RLS-SAFE) ===================== */

export async function createRequest(req: Partial<RequestRow>) {
  const { error } = await supabase.from("blood_requests").insert({
    hospital_name: req.hospital_name ?? "Hospital",
    blood_group: req.blood_group ?? "O+",
    units_requested: req.units_requested ?? 1,
    urgency: req.urgency ?? "NORMAL",
    priority_score: req.priority_score ?? 0,
    status: "pending",
    requested_at: new Date().toISOString(),
    remarks: req.remarks ?? null,
  });

  if (error) throw error;
}

export async function createInventoryRow(row: Partial<InventoryRow>) {
  const { error } = await supabase.from("blood_inventory").insert({
    blood_group: row.blood_group ?? "O+",
    units_available: row.units_available ?? 0,
    minimum_required: row.minimum_required ?? 5,
    status: row.status ?? "active",
    nearest_expiry: row.nearest_expiry ?? null,
    storage_location: row.storage_location ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function addInventoryUnits(bloodGroup: string, delta: number) {
  const { data, error } = await supabase
    .from("blood_inventory")
    .select("id, units_available")
    .eq("blood_group", bloodGroup)
    .single();

  if (error) throw error;

  const { error: uerr } = await supabase
    .from("blood_inventory")
    .update({
      units_available: (data.units_available ?? 0) + delta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (uerr) throw uerr;
}

export async function approveRequest(requestId: string, approver = "system") {
  const { data: req, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error) throw error;

  await supabase
    .from("blood_requests")
    .update({
      status: "approved",
      approved_by: approver,
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  await supabase.from("blood_dispatch_log").insert({
    request_id: requestId,
    blood_group: req.blood_group,
    units_dispatched: req.units_requested,
    dispatch_time: new Date().toISOString(),
    delivery_status: "dispatched",
  });
}

export async function rejectRequest(requestId: string, reason?: string) {
  const { error } = await supabase
    .from("blood_requests")
    .update({ status: "rejected", remarks: reason ?? null })
    .eq("id", requestId);

  if (error) throw error;
}

export async function upsertDonor(donor: Partial<DonorRow>) {
  const { error } = await supabase.from("donors").upsert(donor);
  if (error) throw error;
}

export async function deleteDonor(id: string) {
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertStaff(staff: Partial<StaffRow>) {
  const { error } = await supabase.from("bloodbank_staff").upsert(staff);
  if (error) throw error;
}

export async function deleteStaff(id: string) {
  const { error } = await supabase.from("bloodbank_staff").delete().eq("id", id);
  if (error) throw error;
}
