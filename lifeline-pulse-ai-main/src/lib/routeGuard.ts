export function getRedirectPath(profile: any) {
  // ✅ DO NOTHING until profile is fully loaded
  if (!profile) return null;

  const role = profile.primary_role;
  const verified = profile.is_verified;

  // ⛔ Block unverified hospitals / blood banks
  if (
    (role === "hospital_staff" || role === "blood_bank") &&
    !verified
  ) {
    return "/pending-verification";
  }

  // ✅ Normal routing
  switch (role) {
    case "patient":
      return "/dashboard/patient";
    case "donor":
      return "/dashboard/donor";
    case "hospital_staff":
      return "/hospital";
    case "blood_bank":
      return "/dashboard/blood-bank";
    case "volunteer":
      return "/dashboard/volunteer";
    case "admin":
      return "/dashboard/admin";
    default:
      return null;
  }
}
