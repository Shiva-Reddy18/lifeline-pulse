import VolunteerRegister from "./VolunteerRegister";
import VolunteerLogin from "./VolunteerLogin";
import VolunteerDashboard from "./VolunteerDashboard";

export default function VolunteerGate() {
  const volunteer = JSON.parse(
    localStorage.getItem("volunteer") || "{}"
  );

  if (!volunteer.isRegistered) {
    return <VolunteerRegister />;
  }

  if (!volunteer.isLoggedIn) {
    return <VolunteerLogin />;
  }

  return <VolunteerDashboard />;
}
