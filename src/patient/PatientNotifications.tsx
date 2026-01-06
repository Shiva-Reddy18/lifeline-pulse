const PatientNotifications = () => {
  return (
    <section className="bg-white border rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">
        Notifications
      </h2>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          🔴 Donor accepted your request
        </div>
        <div className="flex items-center gap-2">
          🟢 Emergency request sent successfully
        </div>
      </div>
    </section>
  );
};

export default PatientNotifications;
