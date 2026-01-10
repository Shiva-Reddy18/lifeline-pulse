// src/blood-bank/bloodBankService.ts

export type StockItem = {
  id: string;
  bloodGroup: string;
  units: number;
};

export type HospitalRequest = {
  id: string;
  hospital: string;
  bloodGroup: string;
  unitsNeeded: number;
  urgency: "Normal" | "Critical";
};

export type DeliveryRecord = {
  id: string;
  hospital: string;
  bloodGroup: string;
  unitsSent: number;
  date: string;
};

// 🧪 In-memory mock database (for demo)
let stock: StockItem[] = [
  { id: "1", bloodGroup: "A+", units: 8 },
  { id: "2", bloodGroup: "A-", units: 2 },
  { id: "3", bloodGroup: "B+", units: 5 },
  { id: "4", bloodGroup: "O+", units: 12 },
  { id: "5", bloodGroup: "O-", units: 1 },
  { id: "6", bloodGroup: "AB+", units: 4 },
];

let hospitalRequests: HospitalRequest[] = [
  { id: "r1", hospital: "City Hospital", bloodGroup: "O-", unitsNeeded: 2, urgency: "Critical" },
  { id: "r2", hospital: "Apollo Clinic", bloodGroup: "A+", unitsNeeded: 1, urgency: "Normal" },
  { id: "r3", hospital: "MedCare", bloodGroup: "B+", unitsNeeded: 2, urgency: "Normal" },
];

let deliveryLog: DeliveryRecord[] = [];

// ================= STOCK =================

export const getStock = async (): Promise<StockItem[]> => {
  return JSON.parse(JSON.stringify(stock));
};

export const updateStock = async (bloodGroup: string, delta: number) => {
  const item = stock.find((s) => s.bloodGroup === bloodGroup);
  if (!item) return;

  item.units = Math.max(0, item.units + delta);
};

// ================= REQUESTS =================

export const getHospitalRequests = async (): Promise<HospitalRequest[]> => {
  return JSON.parse(JSON.stringify(hospitalRequests));
};

export const acceptRequest = async (id: string) => {
  // For demo, just keep it
};

export const rejectRequest = async (id: string) => {
  hospitalRequests = hospitalRequests.filter((r) => r.id !== id);
};

export const fulfillRequest = async (id: string) => {
  const req = hospitalRequests.find((r) => r.id === id);
  if (!req) return;

  // reduce stock
  const item = stock.find((s) => s.bloodGroup === req.bloodGroup);
  if (item) {
    item.units = Math.max(0, item.units - req.unitsNeeded);
  }

  // log delivery
  deliveryLog.push({
    id: Math.random().toString(),
    hospital: req.hospital,
    bloodGroup: req.bloodGroup,
    unitsSent: req.unitsNeeded,
    date: new Date().toISOString(),
  });

  hospitalRequests = hospitalRequests.filter((r) => r.id !== id);
};

// ================= DELIVERIES =================

export const getDeliveryLog = async (): Promise<DeliveryRecord[]> => {
  return JSON.parse(JSON.stringify(deliveryLog));
};
