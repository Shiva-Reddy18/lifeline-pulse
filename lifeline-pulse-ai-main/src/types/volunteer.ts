export type TaskStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
export type TaskUrgency = "emergency" | "urgent" | "normal";

export interface DeliveryTask {
  id: string;
  status: TaskStatus;
  urgency: TaskUrgency;
  bloodGroup: string;
  units: number;
  pickupHospital: string;
  pickupAddress: string;
  dropHospital: string;
  dropAddress: string;
  contactNumber: string;
  estimatedTime: number;
  distance: number;
}
