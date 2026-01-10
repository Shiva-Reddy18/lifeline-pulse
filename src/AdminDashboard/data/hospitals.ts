export interface Hospital {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_role: string;
  role: string;
  blood_group: string; // Might not be applicable, but included as per columns
  address: string;
  is_verified: boolean;
  created_at: string;
}

export const hospitals: Hospital[] = [
  {
    id: "h1i2-j3k4",
    full_name: "Apollo Hospitals",
    email: "contact@apollohospitals.com",
    phone: "+91 9876543212",
    primary_role: "hospital",
    role: "hospital",
    blood_group: "N/A", // Not applicable for hospitals
    address: "Jubilee Hills, Hyderabad",
    is_verified: true,
    created_at: "2025-01-07T08:00:00Z",
  },
  // Add more hospital data here as needed
];
