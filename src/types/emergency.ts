// Blood group types used throughout the application
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Emergency request status lifecycle
export type EmergencyStatus = 
  | 'created'
  | 'hospital_verified'
  | 'accepted'
  | 'in_transit'
  | 'fulfilled'
  | 'auto_closed'
  | 'expired';

// Urgency levels for visual indicators
export type UrgencyLevel = 'stable' | 'warning' | 'critical';

// User roles with strict separation
export type UserRole = 
  | 'patient'
  | 'attender'
  | 'donor'
  | 'hospital_staff'
  | 'blood_bank'
  | 'volunteer'
  | 'transport'
  | 'admin';

// Emergency request interface
export interface EmergencyRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  hospital?: {
    id: string;
    name: string;
    phone: string;
  };
  status: EmergencyStatus;
  urgencyLevel: UrgencyLevel;
  condition: string;
  createdAt: Date;
  expiresAt: Date;
  estimatedTime?: number; // minutes
}

// Donor interface
export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lastDonation?: Date;
  isEligible: boolean;
  location: {
    lat: number;
    lng: number;
  };
  verified: boolean;
}

// Hospital interface
export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  bloodStock: Record<BloodGroup, number>;
  isVerified: boolean;
  distance?: number; // km
}

// Blood bank interface
export interface BloodBank {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  stock: Record<BloodGroup, number>;
  operatingHours: string;
  distance?: number;
}

// Blood group compatibility data
export const bloodCompatibility: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// Blood group rarity (for criticality scoring)
export const bloodRarity: Record<BloodGroup, number> = {
  'AB-': 0.6,
  'B-': 1.5,
  'AB+': 3.4,
  'A-': 6.3,
  'O-': 6.6,
  'B+': 8.5,
  'A+': 30.9,
  'O+': 37.4,
};

// Calculate criticality score
export function calculateCriticalityScore(
  bloodGroup: BloodGroup,
  condition: 'trauma' | 'surgery' | 'dengue' | 'other',
  timeElapsedMinutes: number,
  distanceKm: number
): number {
  const rarityScore = (100 - bloodRarity[bloodGroup]) / 100;
  const conditionScore = {
    trauma: 1.0,
    dengue: 0.9,
    surgery: 0.7,
    other: 0.5,
  }[condition];
  const timeScore = Math.min(timeElapsedMinutes / 120, 1); // Max at 2 hours
  const distanceScore = Math.min(distanceKm / 50, 1); // Max at 50km

  return (rarityScore * 0.3 + conditionScore * 0.3 + timeScore * 0.25 + distanceScore * 0.15) * 100;
}

// Get urgency level from criticality score
export function getUrgencyLevel(score: number): UrgencyLevel {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'warning';
  return 'stable';
}
