import { motion } from "framer-motion";
import PatientHeader from "./PatientHeader";
import PatientInfoCard from "./PatientInfoCard";
import PatientNotifications from "./PatientNotifications";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import NearbyDonors from "./NearbyDonors";
import RequestHistory from "./RequestHistory";

export default function PatientDashboard() {
  return (
    <div className="relative min-h-screen pt-20 pb-10 patient-gradient-bg">
      <div className="container mx-auto px-4">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <PatientHeader />
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            <PatientInfoCard />
            <PatientNotifications />
            <RequestHistory />
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            <EmergencyBloodRequest />
            <NearbyDonors />
          </div>

        </div>
      </div>
    </div>
  );
}
