/* ---------------- Delivery Status ---------------- */
export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "delayed";

/* ---------------- Delivery Type ---------------- */
/**
 * This interface is shared by:
 * - VolunteerDashboard
 * - ActiveTaskCard
 * - DeliveryHistory
 * - TransportRequests
 *
 * It matches Supabase + demo data safely
 */
export interface Delivery {
  id: string;

  blood_group: string;
  units: number;

  pickup_location: string;
  drop_location: string;

  distance_km: number;
  eta_min: number;

  status: DeliveryStatus;

  contact_phone: string;

  created_at: string;

  /* Optional fields (SAFE for future use) */
  completed_at?: string | null;
  priority?: "normal" | "emergency";
  rating?: number | null;
}
