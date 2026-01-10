export interface Donor {
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

export const donors: Donor[] = [
  {
    id: "d1e2-f3g4",
    full_name: "Amit Sharma",
    email: "amit.sharma@gmail.com",
    phone: "+91 9876543211",
    primary_role: "donor",
    role: "donor",
    blood_group: "O+",
    address: "Kondapur, Hyderabad",
    is_verified: true,
    created_at: "2025-01-08T09:00:00Z",
  },
  // Add more donor data here as needed
];
