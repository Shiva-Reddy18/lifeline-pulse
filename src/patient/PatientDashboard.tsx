import PatientInfoCard from "./PatientInfoCard";
import PatientNotifications from "./PatientNotifications";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import NearbyDonors from "./NearbyDonors";
import RequestHistory from "./RequestHistory";

const PatientDashboard = () => {
  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <p className="text-sm text-green-600">● ONLINE</p>
      </div>
<div className="space-y-6">
  <PatientInfoCard />
  <PatientNotifications />
  <EmergencyBloodRequest />
  <NearbyDonors />
  <RequestHistory />
</div>
    </div>
  );
};

export default PatientDashboard;
