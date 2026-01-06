import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BloodTypeBadge } from '@/components/BloodTypeBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusTimeline } from '@/components/StatusTimeline';
import { BloodGroup, EmergencyRequest, UrgencyLevel } from '@/types/emergency';
import { 
  Hospital,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Users,
  Droplet,
  Activity,
  Phone,
  Send,
  RefreshCw
} from 'lucide-react';

// Mock incoming emergencies
const mockEmergencies: EmergencyRequest[] = [
  {
    id: 'em-1',
    patientName: 'Anonymous Patient',
    bloodGroup: 'O-',
    unitsRequired: 3,
    location: { lat: 17.385, lng: 78.4867, address: '123 Accident Site, Highway 7' },
    status: 'created',
    urgencyLevel: 'critical',
    condition: 'Trauma - Road Accident',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    expiresAt: new Date(Date.now() + 1.75 * 60 * 60 * 1000),
  },
  {
    id: 'em-2',
    patientName: 'Anonymous Patient',
    bloodGroup: 'B+',
    unitsRequired: 2,
    location: { lat: 17.390, lng: 78.490, address: '456 Residential Area, Block C' },
    status: 'created',
    urgencyLevel: 'warning',
    condition: 'Dengue - Platelet Required',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    expiresAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
  },
  {
    id: 'em-3',
    patientName: 'Anonymous Patient',
    bloodGroup: 'A+',
    unitsRequired: 4,
    location: { lat: 17.380, lng: 78.480, address: '789 City Hospital, Surgery Wing' },
    status: 'hospital_verified',
    urgencyLevel: 'stable',
    condition: 'Scheduled Surgery',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
  },
];

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Mock blood stock
const mockBloodStock: Record<BloodGroup, number> = {
  'A+': 15, 'A-': 3, 'B+': 12, 'B-': 2, 'AB+': 5, 'AB-': 1, 'O+': 20, 'O-': 4
};

export { default } from "../hospital-dashboard";
