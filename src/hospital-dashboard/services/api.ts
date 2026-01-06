import { supabase } from '@/integrations/supabase/client';
import { executeAdminAction } from '@/lib/adminActions';

export async function fetchHospitalEmergencies(hospitalId?: string) {
  try {
    // Basic query: fetch recent open emergencies; filter by hospital_id when provided
    let q = supabase.from('emergencies').select('*').order('created_at', { ascending: false }).limit(200);

    if (hospitalId) {
      q = q.eq('assigned_hospital_id', hospitalId);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchHospitalEmergencies error:', err);
    return [];
  }
}

export async function fetchEmergencyById(id: string) {
  try {
    const { data, error } = await supabase.from('emergencies').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('fetchEmergencyById error:', err);
    return null;
  }
}

export async function requestAdminApproval(payload: Record<string, any>) {
  try {
    // Use the server-side admin-action function to request approval; server will enforce auth/roles
    const result = await executeAdminAction({ action: 'force_escalation', data: payload });
    return result;
  } catch (err) {
    console.error('requestAdminApproval error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
