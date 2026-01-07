import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import type {
  EmergencyRequest,
  EmergencyStatus as EmergencyStatusType
} from '@/types/emergency';
import {
  Heart,
  MapPin,
  Phone,
  Hospital,
  Clock,
  User,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Truck
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client'; // adjust if your client is default export

/* ------------------------------------------------------------------ */
/* Demo base request (used as fallback)                                */
/* ------------------------------------------------------------------ */
const baseRequest: EmergencyRequest = {
  id: 'demo-request',
  patientName: 'Emergency Patient',
  bloodGroup: 'B+',
  unitsRequired: 2,
  location: {
    lat: 17.385,
    lng: 78.4867,
    address: 'Detected via GPS',
  },
  hospital: {
    id: 'hosp-1',
    name: 'City Central Hospital',
    phone: '+91 98765 43210',
  },
  status: 'created',
  urgencyLevel: 'warning',
  condition: 'Surgery',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  estimatedTime: 45,
};

/* ---------------- utility ---------------- */
const isValidUUID = (value?: string | null) =>
  !!value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function mapRowToRequest(row: any): EmergencyRequest {
  return {
    id: row.id ?? baseRequest.id,
    patientName: row.patient_name ?? row.patientName ?? baseRequest.patientName,
    bloodGroup: row.blood_group ?? row.bloodGroup ?? baseRequest.bloodGroup,
    unitsRequired: row.units_required ?? row.unitsRequired ?? 1,
    location: {
      lat:
        typeof row.latitude === 'number'
          ? row.latitude
          : typeof row.lat === 'number'
          ? row.lat
          : baseRequest.location.lat,
      lng:
        typeof row.longitude === 'number'
          ? row.longitude
          : typeof row.lng === 'number'
          ? row.lng
          : baseRequest.location.lng,
      address: row.address ?? baseRequest.location.address,
    },
    hospital:
      row.hospital_id || row.hospital_name || row.hospital
        ? {
            id: row.hospital_id ?? row.hospital?.id ?? null,
            name: row.hospital_name ?? row.hospital?.name ?? '',
            phone: row.hospital_phone ?? row.hospital?.phone ?? '',
          }
        : baseRequest.hospital,
    status: row.status ?? baseRequest.status,
    urgencyLevel: row.urgency_level ?? row.urgencyLevel ?? baseRequest.urgencyLevel,
    condition: row.condition ?? baseRequest.condition,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    expiresAt: row.expires_at ? new Date(row.expires_at) : baseRequest.expiresAt,
    estimatedTime: row.estimated_time ?? baseRequest.estimatedTime,
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function EmergencyStatusPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  // Try to read stored location synchronously for initial state (avoid hook-order issues)
  const readStoredLocation = (): EmergencyRequest['location'] | null => {
    try {
      const raw = sessionStorage.getItem('emergency_location');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return {
          lat: parsed.latitude,
          lng: parsed.longitude,
          address: parsed.address ?? 'Current GPS Location',
        };
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Initialize request with stored location fallback
  const [request, setRequest] = useState<EmergencyRequest>(() => ({
    ...baseRequest,
    location: readStoredLocation() ?? baseRequest.location,
  }));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // Also expose storedLocation via hook for later use
  const storedLocation = useMemo(() => readStoredLocation(), []);

  // storedRequestId fallback
  const storedRequestId = useMemo(() => {
    try {
      return sessionStorage.getItem('emergency_request_id');
    } catch {
      return null;
    }
  }, []);

  // Fetch only when id is valid UUID
  const fetchRequestFromDb = async (id?: string) => {
    setLoadingRequest(true);
    setFetchError(null);

    if (!id || !isValidUUID(id)) {
      // skip DB fetch; keep current UI (which already has storedLocation)
      setLoadingRequest(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setFetchError(error.message ?? 'Failed to fetch request');
        setLoadingRequest(false);
        return null;
      }

      const mapped = mapRowToRequest(data);

      // ensure we keep storedLocation if DB row lacks location fields
      setRequest(prev => ({
        ...mapped,
        location: (mapped.location && typeof mapped.location.lat === 'number' && typeof mapped.location.lng === 'number')
          ? mapped.location
          : storedLocation ?? prev.location,
      }));

      setLoadingRequest(false);
      return mapped;
    } catch (err: any) {
      setFetchError(err?.message ?? 'Unknown error');
      setLoadingRequest(false);
      return null;
    }
  };

  useEffect(() => {
    // determine effective id (only if valid UUID)
    const effectiveId = isValidUUID(requestId ?? null)
      ? requestId!
      : isValidUUID(storedRequestId ?? null)
      ? storedRequestId!
      : undefined;

    if (!effectiveId) {
      // No DB-backed id: keep the UI with stored location already set
      setLoadingRequest(false);
      return;
    }

    // initial fetch
    void fetchRequestFromDb(effectiveId);

    // polling
    pollRef.current = window.setInterval(() => {
      void fetchRequestFromDb(effectiveId);
    }, 6000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, storedRequestId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const effectiveId = isValidUUID(requestId ?? null)
      ? requestId!
      : isValidUUID(storedRequestId ?? null)
      ? storedRequestId!
      : undefined;

    await fetchRequestFromDb(effectiveId);
    await new Promise(res => setTimeout(res, 600));
    setIsRefreshing(false);
  };

  const getStatusMessage = () => {
    switch (request.status) {
      case 'created':
        return 'Waiting for a verified hospital to accept your request. We have routed your request to nearby hospitals.';
      case 'hospital_accepted':
        return 'A hospital has accepted your request and will coordinate further. Please follow their instructions.';
      default:
        return 'Processing your request...';
    }
  };

  const isFulfilled = request.status === 'fulfilled' || request.status === 'completed';

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          {fetchError && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{fetchError}</div>}

          <Card variant={isFulfilled ? 'elevated' : 'emergency'}>
            <CardContent className="pt-6 text-center">
              <motion.div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isFulfilled ? 'bg-status-stable/10' : 'bg-primary/10'}`} animate={!isFulfilled ? { scale: [1, 1.05, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
                {isFulfilled ? <CheckCircle className="w-10 h-10 text-status-stable" /> : request.status === 'in_transit' ? <Truck className="w-10 h-10 text-primary" /> : <Heart className="w-10 h-10 text-primary animate-heartbeat" />}
              </motion.div>

              <Badge variant={isFulfilled ? 'verified' : (request.urgencyLevel ?? 'warning')} className="mb-2">
                {isFulfilled ? 'COMPLETED' : (request.status ?? 'CREATED').replace('_', ' ').toUpperCase()}
              </Badge>

              <h1 className="text-2xl font-display font-bold mb-2">
                {request.status === 'hospital_accepted' ? 'Hospital Accepted' : 'Emergency In Progress'}
              </h1>

              <p className="text-muted-foreground mb-6">{getStatusMessage()}</p>

              {request.status !== 'hospital_accepted' && request.expiresAt && (
                <CountdownTimer expiresAt={new Date(request.expiresAt)} urgency={request.urgencyLevel ?? 'warning'} />
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Request Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Blood Type</span>
                <BloodTypeBadge bloodGroup={request.bloodGroup} size="lg" />
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Units</span>
                <p className="text-xl font-bold">{request.unitsRequired}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Condition</span>
                <p className="font-semibold">{request.condition}</p>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-semibold">{request.estimatedTime ?? 45} min</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Hospital className="w-5 h-5 text-secondary" />Assigned Hospital</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{request.hospital?.name ?? 'Not assigned'}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {request.location?.address ?? `${request.location?.lat ?? 'N/A'}, ${request.location?.lng ?? 'N/A'}`}
                </p>
              </div>
              {request.hospital?.phone ? (
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${request.hospital?.phone}`, '_self')}><Phone className="w-4 h-4" />Call</Button>
              ) : (
                <div className="text-sm text-muted-foreground">No phone provided</div>
              )}
            </CardContent>
          </Card>

          <StatusTimeline currentStatus={request.status as EmergencyStatusType} />

          {isFulfilled && (
            <Button variant="hero" className="w-full" onClick={() => navigate('/')}>
              <Heart className="w-5 h-5" />
              Return Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
