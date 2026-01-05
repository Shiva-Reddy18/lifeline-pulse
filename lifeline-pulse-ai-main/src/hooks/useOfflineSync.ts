import { useState, useEffect, useCallback } from 'react';
import { 
  initOfflineDB, 
  isOffline, 
  onSyncStatusChange,
  getQueuedEmergencies,
  syncQueuedEmergencies,
  cacheBloodBanks,
  getCachedBloodBanks,
  getBloodBanksSyncStatus,
  queueEmergency,
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

  useEffect(() => {
    // Initialize DB
    initOfflineDB();

    // Listen for online/offline changes
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
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

    // Initialize auto-sync
    const cleanup = initAutoSync(syncEmergency);

    // Check pending count
    const checkPending = async () => {
      const queued = await getQueuedEmergencies();
      setPendingCount(queued.length);
    };
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    cacheBloodBankData,
    getBloodBanks,
    forceSync
  };
}
