import { supabase } from "@/integrations/supabase/client";

export interface VolunteerRecord {
  id: string;
  name: string | null;
  phone: string | null;
  is_online: boolean;
  total_deliveries: number;
  on_time_rate: number;
  rating: number;
}

/**
 * ✅ FRONTEND-SAFE VOLUNTEER LOOKUP
 *
 * Rules:
 * - auth.users.id === volunteers.id
 * - NEVER throw errors
 * - NEVER console.error
 * - If volunteer row not found → return null
 * - Dashboard must still render
 */
export async function getVolunteerForCurrentUser(
  userId?: string | null
): Promise<VolunteerRecord | null> {
  if (!userId) return null;

  try {
    const { data } = await supabase
      .from("volunteers")
      .select(
        "id, name, phone, is_online, total_deliveries, on_time_rate, rating"
      )
      .eq("id", userId)
      .maybeSingle(); // ✅ BEST for optional rows

    return data ?? null;
  } catch {
    // ⛔ NEVER break UI
    return null;
  }
}
