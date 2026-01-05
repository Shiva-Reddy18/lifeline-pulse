import { openDB, IDBPDatabase } from 'idb';
import { BloodGroup } from '@/types/emergency';

const DB_NAME = 'lifeline-x-offline';
const DB_VERSION = 1;

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
  synced: boolean;
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

      // Sync metadata store
      if (!database.objectStoreNames.contains('syncMetadata')) {
        database.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    },
  });

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
    synced: false,
    created_at: new Date().toISOString()
  });
  
  return id;
}

export async function getQueuedEmergencies(): Promise<EmergencyQueueItem[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('emergencyQueue', 'by-synced', IDBKeyRange.only(0));
}

export async function markEmergencySynced(id: string, serverId?: string): Promise<void> {
  const database = await initOfflineDB();
  const emergency = await database.get('emergencyQueue', id);
  
  if (emergency) {
    await database.put('emergencyQueue', {
      ...emergency,
      id: serverId || id,
      synced: true
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
