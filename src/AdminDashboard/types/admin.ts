export type AdminStat = {
  title: string;
  value: number;
};

export type VerificationItem = {
  id: number;
  name: string;
  type: "Hospital" | "Blood Bank" | "Donor";
};

export type SystemRequest = {
  id: number;
  patient: string;
  bloodGroup: string;
  status: "Pending" | "Fulfilled" | "Flagged";
};