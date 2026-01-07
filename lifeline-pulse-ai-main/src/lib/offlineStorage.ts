import { openDB, IDBPDatabase } from 'idb';
import { BloodGroup } from '@/types/emergency';

const DB_NAME = 'lifeline-x-offline';
const DB_VERSION = 2;

interface BloodBankCache {
  id: string;
  name: string;
  address: string;
  phone: string;
  location_lat: number;
  location_lng: number;
  stock: Record<BloodGroup, number>;
  operating_hours: string;
  cached_at: number;
}

interface EmergencyQueueItem {
  id: string;
  blood_group: BloodGroup;
  units_required: number;
  condition: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  patient_name: string;
  patient_phone?: string;
  created_at: string;
  // Use numeric keys (0/1) for compatibility with IndexedDB key requirements
  synced: number;
  sync_error?: string;
}

interface OfflineDB {
  bloodBanks: {
    key: string;
    value: BloodBankCache;
    indexes: { 'by-cached-at': number };
  };
  emergencyQueue: {
    key: string;
    value: EmergencyQueueItem;
    indexes: { 'by-synced': number; 'by-created': string };
  };
  syncMetadata: {
    key: string;
    value: { key: string; lastSync: number; version: number };
  };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (db) return db;

  db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Blood banks store
      if (!database.objectStoreNames.contains('bloodBanks')) {
        const bloodBanksStore = database.createObjectStore('bloodBanks', { keyPath: 'id' });
        bloodBanksStore.createIndex('by-cached-at', 'cached_at');
      }

      // Emergency queue store
      if (!database.objectStoreNames.contains('emergencyQueue')) {
        const emergencyStore = database.createObjectStore('emergencyQueue', { keyPath: 'id' });
        emergencyStore.createIndex('by-synced', 'synced');
        emergencyStore.createIndex('by-created', 'created_at');
      }

      // Delivery queue store (for offline delivery creation)
      if (!database.objectStoreNames.contains('deliveryQueue')) {
        const deliveryStore = database.createObjectStore('deliveryQueue', { keyPath: 'id' });
        deliveryStore.createIndex('by-synced', 'synced');
        deliveryStore.createIndex('by-created', 'created_at');
      }

      // Sync metadata store
      if (!database.objectStoreNames.contains('syncMetadata')) {
        database.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    },
  });

  // Normalize older boolean 'synced' values to numeric 0/1 to remain compatible with IDB keys
  try {
    if (db.objectStoreNames.contains('deliveryQueue')) {
      const tx = db.transaction('deliveryQueue', 'readwrite');
      const all = await tx.store.getAll();
      for (const item of all) {
        if (typeof (item as any).synced === 'boolean') {
          await tx.store.put({ ...item, synced: (item as any).synced ? 1 : 0 });
        }
      }
      await tx.done;
    }

    if (db.objectStoreNames.contains('emergencyQueue')) {
      const tx2 = db.transaction('emergencyQueue', 'readwrite');
      const all2 = await tx2.store.getAll();
      for (const item of all2) {
        if (typeof (item as any).synced === 'boolean') {
          await tx2.store.put({ ...item, synced: (item as any).synced ? 1 : 0 });
        }
      }
      await tx2.done;
    }
  } catch (err) {
    // Normalize best-effort — do not fail DB init on errors
    console.warn('[OfflineStorage] Normalization failed', err);
  }

  return db;
}

// Blood Bank Caching
export async function cacheBloodBanks(bloodBanks: BloodBankCache[]): Promise<void> {
  const database = await initOfflineDB();
  const tx = database.transaction('bloodBanks', 'readwrite');
  
  for (const bank of bloodBanks) {
    await tx.store.put({ ...bank, cached_at: Date.now() });
  }
  
  await tx.done;
  
  // Update sync metadata
  await database.put('syncMetadata', {
    key: 'bloodBanks',
    lastSync: Date.now(),
    version: 1
  });
}

export async function getCachedBloodBanks(): Promise<BloodBankCache[]> {
  const database = await initOfflineDB();
  return database.getAll('bloodBanks');
}

export async function getBloodBanksSyncStatus(): Promise<{ lastSync: number; isStale: boolean }> {
  const database = await initOfflineDB();
  const metadata = await database.get('syncMetadata', 'bloodBanks');
  const lastSync = metadata?.lastSync || 0;
  const isStale = Date.now() - lastSync > 30 * 60 * 1000; // 30 minutes
  return { lastSync, isStale };
}

// Emergency Queue (Offline-First)
export async function queueEmergency(emergency: Omit<EmergencyQueueItem, 'id' | 'synced'>): Promise<string> {
  const database = await initOfflineDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await database.put('emergencyQueue', {
    ...emergency,
    id,
    synced: 0, // use numeric keys (0 = not synced) because boolean is not a valid IDB key
    created_at: new Date().toISOString()
  });
  
  return id;
}

// Delivery Queue (Offline-First)
export interface DeliveryQueueItem {
  id: string;
  blood_group?: string;
  units?: number;
  pickup_name?: string;
  pickup_address?: string;
  drop_name?: string;
  drop_address?: string;
  contact_phone?: string;
  distance_km?: number;
  eta_minutes?: number;
  status?: string;
  rating?: number | null;
  assigned_offline_to?: string | null;
  created_at: string;
  // Use numeric synced flag (0 = not synced, 1 = synced)
  synced: number;
  sync_error?: string;
}

export async function queueDelivery(delivery: Omit<DeliveryQueueItem, 'id' | 'synced' | 'created_at'>): Promise<string> {
  const database = await initOfflineDB();
  const id = `offline-delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await database.put('deliveryQueue', {
    ...delivery,
    id,
    synced: 0, // 0 = not synced yet
    created_at: new Date().toISOString()
  });

  return id;
}

export async function getQueuedDeliveries(): Promise<DeliveryQueueItem[]> {
  const database = await initOfflineDB();
  // 'synced' is stored as 0/1 numeric key; query for 0 to find unsynced items
  return database.getAllFromIndex('deliveryQueue', 'by-synced', IDBKeyRange.only(0));
}

export async function deleteQueuedDelivery(id: string): Promise<void> {
  const database = await initOfflineDB();
  await database.delete('deliveryQueue', id);
}

export async function markDeliverySynced(id: string, serverId?: string): Promise<void> {
  const database = await initOfflineDB();
  const delivery = await database.get('deliveryQueue', id);
  if (delivery) {
    await database.put('deliveryQueue', {
      ...delivery,
      id: serverId || id,
      synced: 1 // mark as synced using numeric key
    });

    if (serverId && serverId !== id) {
      await database.delete('deliveryQueue', id);
    }
  }
}

export async function markDeliverySyncError(id: string, error: string): Promise<void> {
  const database = await initOfflineDB();
  const delivery = await database.get('deliveryQueue', id);
  if (delivery) {
    await database.put('deliveryQueue', {
      ...delivery,
      sync_error: error
    });
  }
}

export async function syncQueuedDeliveries(
  syncFunction: (delivery: DeliveryQueueItem) => Promise<{ success: boolean; serverId?: string; error?: string }>
): Promise<{ synced: number; failed: number }> {
  const queued = await getQueuedDeliveries();
  let synced = 0;
  let failed = 0;

  for (const delivery of queued) {
    try {
      const result = await syncFunction(delivery);
      if (result.success) {
        await markDeliverySynced(delivery.id, result.serverId);
        synced++;
      } else {
        await markDeliverySyncError(delivery.id, result.error || 'Unknown');
        failed++;
      }
    } catch (err) {
      await markDeliverySyncError(delivery.id, err instanceof Error ? err.message : 'Sync failed');
      failed++;
    }
  }

  return { synced, failed };
}

export async function getQueuedEmergencies(): Promise<EmergencyQueueItem[]> {
  const database = await initOfflineDB();
  // 'synced' is stored as 0/1 numeric key; query for 0 to find unsynced items
  return database.getAllFromIndex('emergencyQueue', 'by-synced', IDBKeyRange.only(0));
}

export async function markEmergencySynced(id: string, serverId?: string): Promise<void> {
  const database = await initOfflineDB();
  const emergency = await database.get('emergencyQueue', id);
  
  if (emergency) {
    await database.put('emergencyQueue', {
      ...emergency,
      id: serverId || id,
      synced: 1 // mark as synced using numeric key
    });
    
    // Remove the old offline entry if we have a new server ID
    if (serverId && serverId !== id) {
      await database.delete('emergencyQueue', id);
    }
  }
}

export async function markEmergencySyncError(id: string, error: string): Promise<void> {
  const database = await initOfflineDB();
  const emergency = await database.get('emergencyQueue', id);
  
  if (emergency) {
    await database.put('emergencyQueue', {
      ...emergency,
      sync_error: error
    });
  }
}

// Online/Offline Detection & Auto-Sync
let syncInProgress = false;
const syncListeners: ((status: 'syncing' | 'synced' | 'error') => void)[] = [];

export function onSyncStatusChange(callback: (status: 'syncing' | 'synced' | 'error') => void): () => void {
  syncListeners.push(callback);
  return () => {
    const index = syncListeners.indexOf(callback);
    if (index > -1) syncListeners.splice(index, 1);
  };
}

function notifySyncStatus(status: 'syncing' | 'synced' | 'error') {
  syncListeners.forEach(cb => cb(status));
}

export async function syncQueuedEmergencies(
  syncFunction: (emergency: EmergencyQueueItem) => Promise<{ success: boolean; serverId?: string; error?: string }>
): Promise<{ synced: number; failed: number }> {
  if (syncInProgress) return { synced: 0, failed: 0 };
  
  syncInProgress = true;
  notifySyncStatus('syncing');
  
  const queued = await getQueuedEmergencies();
  let synced = 0;
  let failed = 0;
  
  for (const emergency of queued) {
    try {
      const result = await syncFunction(emergency);
      
      if (result.success) {
        await markEmergencySynced(emergency.id, result.serverId);
        synced++;
      } else {
        await markEmergencySyncError(emergency.id, result.error || 'Unknown error');
        failed++;
      }
    } catch (error) {
      await markEmergencySyncError(emergency.id, error instanceof Error ? error.message : 'Sync failed');
      failed++;
    }
  }
  
  syncInProgress = false;
  notifySyncStatus(failed > 0 ? 'error' : 'synced');
  
  return { synced, failed };
}

// Initialize auto-sync on online
export function initAutoSync(
  syncFunction: (emergency: EmergencyQueueItem) => Promise<{ success: boolean; serverId?: string; error?: string }>
): () => void {
  const handleOnline = async () => {
    console.log('[OfflineSync] Back online, syncing queued emergencies...');
    await syncQueuedEmergencies(syncFunction);
  };

  window.addEventListener('online', handleOnline);
  
  // Initial sync if online
  if (navigator.onLine) {
    handleOnline();
  }
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

// Check if we're offline
export function isOffline(): boolean {
  return !navigator.onLine;
}

// Clear old cached data
export async function cleanupOldCache(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  const database = await initOfflineDB();
  const cutoff = Date.now() - maxAgeMs;
  
  const tx = database.transaction('bloodBanks', 'readwrite');
  const banks = await tx.store.getAll();
  
  for (const bank of banks) {
    if (bank.cached_at < cutoff) {
      await tx.store.delete(bank.id);
    }
  }
  
  await tx.done;
}
