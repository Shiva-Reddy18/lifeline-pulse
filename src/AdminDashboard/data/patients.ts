export interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_role: string;
  role: string;
  blood_group: string;
  address: string;
  is_verified: boolean;
  created_at: string;
}

export const patients: Patient[] = [
  {
    id: "a1b2-c3d4",
    full_name: "Ravi Kumar",
    email: "ravi@gmail.com",
    phone: "+91 9876543210",
    primary_role: "patient",
    role: "patient",
    blood_group: "O+",
    address: "Madhapur, Hyderabad",
    is_verified: true,
    created_at: "2025-01-09T10:00:00Z",
  },
  // Add more patient data here as needed
];
