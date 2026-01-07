import { SystemRequest } from "../types/admin";

export const systemRequests: SystemRequest[] = [
  { id: 1, patient: "Anil", bloodGroup: "O+", status: "Pending" },
  { id: 2, patient: "Sita", bloodGroup: "B+", status: "Fulfilled" },
  { id: 3, patient: "Unknown", bloodGroup: "AB+", status: "Flagged" },
];