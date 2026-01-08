import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch blood bank stock by matching email and name.
 * Returns { id, name, email, stock } or null if not found.
 */
export async function getBloodBankUnitsByEmailAndName(email: string, name: string) {
  try {
    const { data, error } = await supabase
      .from('blood_banks')
      .select('id, name, email, stock')
      .eq('email', email)
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching blood bank:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      stock: data.stock || {}
    };
  } catch (e) {
    console.error('Failed to fetch blood bank units:', e);
    return null;
  }
}

export default getBloodBankUnitsByEmailAndName;

/**
 * Polling-based watcher: periodically refetches the blood bank stock and
 * invokes `onChange` when the stock object changes.
 * Returns a stop function to cancel the polling.
 */
export function watchBloodBankUnitsByEmailAndName(
  email: string,
  name: string,
  onChange: (result: { id: string; name: string; email: string; stock: Record<string, number> } | null) => void,
  intervalMs = 5000
) {
  let mounted = true;
  let last = null as any;

  const fetchOnce = async () => {
    const res = await getBloodBankUnitsByEmailAndName(email, name);
    if (!mounted) return;
    const next = res ? res.stock : null;
    const changed = JSON.stringify(last) !== JSON.stringify(next);
    if (changed) {
      last = next;
      onChange(res);
    }
  };

  // Initial fetch
  fetchOnce();

  const id = setInterval(fetchOnce, intervalMs);

  return () => {
    mounted = false;
    clearInterval(id);
  };
}

