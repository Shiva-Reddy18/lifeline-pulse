import VolunteerHeader from "./VolunteerHeader";
import VolunteerStats from "./VolunteerStats";
import AvailabilityToggle from "./AvailabilityToggle";
import ActiveTaskCard from "./ActiveTaskCard";
import TransportRequests from "./TransportRequests";
import DeliveryHistory from "./DeliveryHistory";

export default function VolunteerDashboard() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <VolunteerHeader />

      {/* Stats */}
      <VolunteerStats />

      {/* Availability */}
      <AvailabilityToggle />

      {/* Active Task (shown only if exists) */}
      <ActiveTaskCard />

      {/* Incoming Transport Requests */}
      <TransportRequests />

      {/* Past Deliveries */}
      <DeliveryHistory />
    </div>
  );
}
