import PatientHeader from "./PatientHeader";
import PatientInfoCard from "./PatientInfoCard";
import EmergencyBloodRequest from "./EmergencyBloodRequest";
import NearbyDonors from "./NearbyDonors";
import RequestHistory from "./RequestHistory";
import PatientNotifications from "./PatientNotifications";


const PatientDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PatientHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PatientInfoCard />
        <PatientNotifications />
      </div>

      <EmergencyBloodRequest />
      <NearbyDonors />
      <RequestHistory />
    </div>
  );
};

export default PatientDashboard;
