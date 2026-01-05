import { PatientProfile } from "./PatientDashboard";

const PatientHeader = ({ patient }: { patient: PatientProfile }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">
        Welcome, {patient.full_name}
      </h1>
      <p className="text-muted-foreground">
        Manage your emergency profile here
      </p>
    </div>
  );
};

export default PatientHeader;
