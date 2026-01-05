import { supabase } from '@/integrations/supabase/client';

type AdminAction = 
  | "verify_hospital" 
  | "reject_hospital" 
  | "blacklist_user" 
  | "toggle_disaster_mode"
  | "force_escalation"
  | "override_emergency";

interface AdminActionParams {
  action: AdminAction;
  targetId?: string;
  data?: Record<string, any>;
}

interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, any>;
}

/**
 * Execute an admin action via server-side authorization
 * All actions are verified on the server to prevent privilege escalation
 */
export async function executeAdminAction(params: AdminActionParams): Promise<AdminActionResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: result.error || 'Admin action failed' 
      };
    }

    return { 
      success: true, 
      message: result.message,
      data: result 
    };
  } catch (error) {
    console.error('Admin action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Convenience functions
export const verifyHospital = (hospitalId: string) => 
  executeAdminAction({ action: 'verify_hospital', targetId: hospitalId });

export const rejectHospital = (hospitalId: string) => 
  executeAdminAction({ action: 'reject_hospital', targetId: hospitalId });

export const blacklistUser = (userId: string, reason: string) => 
  executeAdminAction({ action: 'blacklist_user', targetId: userId, data: { reason } });

export const toggleDisasterMode = (enabled: boolean) => 
  executeAdminAction({ action: 'toggle_disaster_mode', data: { enabled } });

export const forceEscalation = (emergencyId: string) => 
  executeAdminAction({ action: 'force_escalation', targetId: emergencyId });

export const overrideEmergency = (emergencyId: string, status: string) => 
  executeAdminAction({ action: 'override_emergency', targetId: emergencyId, data: { status } });
