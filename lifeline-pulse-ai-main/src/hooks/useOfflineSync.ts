import { useState, useEffect, useCallback } from 'react';
import { 
  initOfflineDB, 
  isOffline, 
  onSyncStatusChange,
  getQueuedEmergencies,
  syncQueuedEmergencies,
  getQueuedDeliveries,
  syncQueuedDeliveries,
  cacheBloodBanks,
  getCachedBloodBanks,
  getBloodBanksSyncStatus,
  queueEmergency,
  queueDelivery,
  initAutoSync
} from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { BloodGroup } from '@/types/emergency';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface EmergencyData {
  blood_group: BloodGroup;
  units_required: number;
  condition: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  patient_name: string;
  patient_phone?: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  // Sync function for emergencies
  const syncEmergency = useCallback(async (emergency: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          bloodGroup: emergency.blood_group,
          unitsRequired: emergency.units_required,
          condition: emergency.condition,
          latitude: emergency.location_lat,
          longitude: emergency.location_lng,
          address: emergency.location_address,
          patientName: emergency.patient_name,
          patientPhone: emergency.patient_phone,
          offlineId: emergency.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || 'Sync failed' };
      }

      const data = await response.json();
      return { success: true, serverId: data.emergencyId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }, []);

  // Sync function for deliveries (used when we queued a delivery while offline)
  const syncDelivery = useCallback(async (delivery: any) => {
    try {
      // Insert directly using supabase client (will use auth cookie/token)
      const { data, error } = await supabase.from('deliveries').insert([{ 
        blood_group: delivery.blood_group,
        units: delivery.units,
        pickup_name: delivery.pickup_name,
        pickup_address: delivery.pickup_address,
        drop_name: delivery.drop_name,
        drop_address: delivery.drop_address,
        contact_phone: delivery.contact_phone,
        distance_km: delivery.distance_km,
        eta_minutes: delivery.eta_minutes,
        status: delivery.status || 'delivered',
        rating: delivery.rating ?? null,
        created_at: delivery.created_at
      }]).select();

      if (error) {
        return { success: false, error: error.message };
      }

      const inserted = data?.[0];
      return { success: true, serverId: inserted?.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  }, []);
  useEffect(() => {
    // Initialize DB
    initOfflineDB();

    // Listen for online/offline changes
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');

      try {
        console.log('[OfflineSync] Back online, syncing queued deliveries and emergencies...');
        const [deliveriesRes, emergenciesRes] = await Promise.all([
          syncQueuedDeliveries(syncDelivery),
          syncQueuedEmergencies(syncEmergency),
        ]);

        // Update pending count after sync
        const queuedE = await getQueuedEmergencies();
        const queuedD = await getQueuedDeliveries();
        setPendingCount(queuedE.length + queuedD.length);

        // Set final sync status
        if ((deliveriesRes.failed + emergenciesRes.failed) > 0) {
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
        }

        // Dispatch global event so UI can show a toast (success/failure summary)
        window.dispatchEvent(new CustomEvent('offline-sync', { detail: { deliveries: deliveriesRes, emergencies: emergenciesRes } }));

        if ((deliveriesRes.synced + emergenciesRes.synced) > 0) {
          console.log('[OfflineSync] Synced queued items', deliveriesRes, emergenciesRes);
          window.dispatchEvent(new CustomEvent('deliveries-changed', { detail: { refresh: true } }));
        }
      } catch (e) {
        console.error('[OfflineSync] sync failed', e);
        setSyncStatus('error');
        window.dispatchEvent(new CustomEvent('offline-sync', { detail: { deliveries: { synced: 0, failed: 0 }, emergencies: { synced: 0, failed: 0 }, error: String(e) } }));
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync status changes
    const unsubscribe = onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Initialize auto-sync for emergencies (keeps older behavior too)
    const cleanup1 = initAutoSync(syncEmergency);

    // Also ensure we run delivery sync when we go online (this is consolidated into handleOnline above)

    // If we're already online, trigger an initial delivery + emergency sync
    if (navigator.onLine) {
      handleOnline().catch((e) => {
        console.error('[OfflineSync] failed initial sync', e);
      });
    }

    const cleanup = () => {
      cleanup1();
    };

    // Check pending count (emergencies + deliveries)
    const checkPending = async () => {
      const queuedE = await getQueuedEmergencies();
      const queuedD = await getQueuedDeliveries();
      setPendingCount(queuedE.length + queuedD.length);
    };
    checkPending();

    // Listen for queue changes triggered elsewhere (e.g., a component queued a new delivery)
    window.addEventListener('offline-queue-changed', checkPending);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', checkPending);
      unsubscribe();
      cleanup();
    };
  }, [syncEmergency]);

  // Create emergency (offline-first)
  const createEmergencyOfflineFirst = useCallback(async (data: EmergencyData) => {
    if (isOffline()) {
      // Queue for later sync
      const offlineId = await queueEmergency({
        blood_group: data.blood_group,
        units_required: data.units_required,
        condition: data.condition,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        location_address: data.location_address,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        created_at: new Date().toISOString()
      });
      
      setPendingCount(prev => prev + 1);
      
      return { 
        success: true, 
        offline: true, 
        offlineId,
        message: 'Emergency queued. Will sync when online.'
      };
    }

    // Online - send directly
    const result = await syncEmergency({
      blood_group: data.blood_group,
      units_required: data.units_required,
      condition: data.condition,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      location_address: data.location_address,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone
    });

    return { 
      success: result.success, 
      offline: false, 
      serverId: result.serverId,
      error: result.error
    };
  }, [syncEmergency]);

  // Create delivery (offline-first)
  const createDeliveryOfflineFirst = useCallback(async (data: any) => {
    if (isOffline()) {
      const offlineId = await queueDelivery({
        blood_group: data.blood_group,
        units: data.units,
        pickup_name: data.pickup_name,
        pickup_address: data.pickup_address,
        drop_name: data.drop_name,
        drop_address: data.drop_address,
        contact_phone: data.contact_phone,
        distance_km: data.distance_km,
        eta_minutes: data.eta_minutes,
        status: data.status,
        rating: typeof data.rating === 'number' ? data.rating : null,
        assigned_offline_to: data.assigned_offline_to || null
      });

      return { success: true, offline: true, offlineId, message: 'Delivery queued — will sync when online.' };
    }

    // Online: insert immediately using syncDelivery
    const result = await syncDelivery({ ...data, created_at: new Date().toISOString() } as any);
    return { success: result.success, offline: false, serverId: result.serverId, error: result.error };
  }, [syncDelivery]);

  // Cache blood banks
  const cacheBloodBankData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blood_banks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        await cacheBloodBanks(data.map(bank => ({
          id: bank.id,
          name: bank.name,
          address: bank.address,
          phone: bank.phone,
          location_lat: bank.location_lat,
          location_lng: bank.location_lng,
          stock: bank.stock as Record<BloodGroup, number>,
          operating_hours: bank.operating_hours || '24/7',
          cached_at: Date.now()
        })));
      }
    } catch (error) {
      console.error('Failed to cache blood banks:', error);
    }
  }, []);

  // Get blood banks (cache-first)
  const getBloodBanks = useCallback(async () => {
    const { isStale } = await getBloodBanksSyncStatus();
    
    if (isOffline() || !isStale) {
      const cached = await getCachedBloodBanks();
      if (cached.length > 0) {
        return { data: cached, fromCache: true };
      }
    }

    // Fetch fresh data
    const { data, error } = await supabase
      .from('blood_banks')
      .select('*')
      .eq('is_active', true);

    if (error) {
      // Fall back to cache on error
      const cached = await getCachedBloodBanks();
      return { data: cached, fromCache: true, error };
    }

    // Update cache
    if (data) {
      await cacheBloodBanks(data.map(bank => ({
        id: bank.id,
        name: bank.name,
        address: bank.address,
        phone: bank.phone,
        location_lat: bank.location_lat,
        location_lng: bank.location_lng,
        stock: bank.stock as Record<BloodGroup, number>,
        operating_hours: bank.operating_hours || '24/7',
        cached_at: Date.now()
      })));
    }

    return { data: data || [], fromCache: false };
  }, []);

  // Manual sync
  const forceSync = useCallback(async () => {
    if (!isOnline) return { synced: 0, failed: 0 };
    
    setSyncStatus('syncing');
    const result = await syncQueuedEmergencies(syncEmergency);
    
    const queued = await getQueuedEmergencies();
    setPendingCount(queued.length);
    
    return result;
  }, [isOnline, syncEmergency]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    createEmergencyOfflineFirst,
    createDeliveryOfflineFirst,
    cacheBloodBankData,
    getBloodBanks,
    forceSync
  };
}
