const NearbyDonors = () => {
  return (
    <section className="bg-white border rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">
        Nearby Donors
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
          <span>🩸 O+</span>
          <span>2 km</span>
        </div>
        <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
          <span>🩸 A+</span>
          <span>4 km</span>
        </div>
      </div>
    </section>
  );
};

export default NearbyDonors;
