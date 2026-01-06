import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { differenceInSeconds, addDays, formatDistanceStrict } from "date-fns";
import { FiLogOut } from "react-icons/fi"; // Door icon

/* ================= TYPES ================= */
interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Request {
  id: string;
  patientName: string;
  patientPhone: string;
  bloodType: string;
  requestedAt: string;
  hospital: Hospital;
}

interface Donor {
  id: string;
  name: string;
  lastDonationDate?: string;
}

/* ================= COMPONENT ================= */
const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [donor, setDonor] = useState<Donor | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [acceptedRequest, setAcceptedRequest] = useState<Request | null>(null);
  const [totalDonations, setTotalDonations] = useState<number>(2);
  const [cooldown, setCooldown] = useState<string>("Can Donate ✅");

  const DONATION_INTERVAL_DAYS = 90; // Days until donor can donate again

  /* ================= MOCK DATA ================= */
  useEffect(() => {
    setDonor({
      id: "d1",
      name: "John Doe",
      lastDonationDate: undefined,
    });

    setRequests([
      {
        id: "r1",
        patientName: "Alice",
        patientPhone: "9876543210",
        bloodType: "A+",
        requestedAt: "2026-01-02 10:30 AM",
        hospital: {
          id: "h1",
          name: "City Hospital",
          address: "Road No 12, Banjara Hills, Hyderabad",
          lat: 17.385044,
          lng: 78.486671,
        },
      },
      {
        id: "r2",
        patientName: "Bob",
        patientPhone: "9123456780",
        bloodType: "B+",
        requestedAt: "2026-01-03 08:15 PM",
        hospital: {
          id: "h2",
          name: "Central Blood Bank",
          address: "MG Road, Secunderabad, Hyderabad",
          lat: 17.435044,
          lng: 78.498671,
        },
      },
    ]);
  }, []);

  /* ================= COOLDOWN TIMER ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      if (donor?.lastDonationDate) {
        const lastDonation = new Date(donor.lastDonationDate);
        const nextEligible = addDays(lastDonation, DONATION_INTERVAL_DAYS);
        const now = new Date();
        const diffSeconds = differenceInSeconds(nextEligible, now);
        if (diffSeconds <= 0) {
          setCooldown("Can Donate ✅");
        } else {
          const countdown = formatDistanceStrict(nextEligible, now);
          setCooldown(`Next Donation in ${countdown}`);
        }
      } else {
        setCooldown("Can Donate ✅");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [donor]);

  /* ================= LOGIC ================= */
  const canDonate = () => cooldown === "Can Donate ✅";

  const handleAccept = (req: Request) => {
    setAcceptedRequest(req);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setTotalDonations((prev) => prev + 1);

    // Update last donation to today
    const today = new Date().toISOString().split("T")[0];
    setDonor((prev) => (prev ? { ...prev, lastDonationDate: today } : prev));
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSMS = (phone: string) => {
    window.location.href = `sms:${phone}?body=Hello, I am a blood donor from Lifeline. I will be able to donate soon.`;
  };

  const handleNavigate = () => {
    if (!acceptedRequest) return;
    const { lat, lng } = acceptedRequest.hospital;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("donorToken");
    navigate("/login");
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto p-4 pt-36">
      {/* ================= HEADER ================= */}
      <div className="fixed top-0 left-0 w-full bg-red-600 text-white z-50 shadow">
        <div className="max-w-7xl mx-auto p-4 flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome, {donor?.name || "Donor"}</h1>

          <div className="flex flex-wrap gap-2 items-center">
            <Stat label="Total Requests" value={requests.length} />
            <Stat label="Last Donation" value={donor?.lastDonationDate || "—"} />
            <Stat label="Donation Status" value={cooldown} />

            {/* Icon logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-2 p-2 bg-white text-gray-800 rounded hover:bg-gray-200 flex items-center justify-center"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= PENDING REQUESTS ================= */}
      <section className="bg-red-50 p-6 rounded-xl shadow mb-10">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Pending Blood Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm min-w-[700px]">
            <thead className="bg-red-100">
              <tr>
                <th className="w-[14%] px-4 py-3 text-left">Patient</th>
                <th className="w-[8%] px-4 py-3 text-center">Blood</th>
                <th className="w-[18%] px-4 py-3 text-left">Hospital</th>
                <th className="w-[30%] px-4 py-3 text-left">Address</th>
                <th className="w-[16%] px-4 py-3 text-center">Requested At</th>
                <th className="w-[14%] px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="bg-white border-b hover:bg-red-50">
                  <td className="px-4 py-3">{r.patientName}</td>
                  <td className="px-4 py-3 text-center font-bold text-red-600">{r.bloodType}</td>
                  <td className="px-4 py-3">{r.hospital.name}</td>
                  <td className="px-4 py-3 break-words">{r.hospital.address}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">{r.requestedAt}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleAccept(r)}
                      disabled={!canDonate()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md disabled:bg-gray-300"
                    >
                      Accept
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= ACCEPTED PATIENT ================= */}
      {acceptedRequest && (
        <section className="bg-green-50 p-6 rounded-xl shadow mb-10">
          <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Accepted Patient Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Detail label="Patient Name" value={acceptedRequest.patientName} />
            <Detail label="Blood Type" value={acceptedRequest.bloodType} />
            <Detail label="Phone" value={acceptedRequest.patientPhone} />
            <Detail label="Hospital" value={acceptedRequest.hospital.name} />
            <Detail label="Address" value={acceptedRequest.hospital.address} />
            <Detail label="Requested At" value={acceptedRequest.requestedAt} />
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => handleCall(acceptedRequest.patientPhone)}
              className="px-5 py-2 bg-blue-600 text-white rounded"
            >
              📞 Call Patient
            </button>

            <button
              onClick={handleNavigate}
              className="px-5 py-2 bg-green-600 text-white rounded"
            >
              🧭 Navigate
            </button>

            <button
              onClick={() => handleSMS(acceptedRequest.patientPhone)}
              className="px-5 py-2 bg-purple-600 text-white rounded"
            >
              💬 Send SMS
            </button>
          </div>
        </section>
      )}

      {/* ================= DONOR IMPACT ================= */}
      {acceptedRequest && (
        <section className="bg-purple-50 p-6 rounded-xl shadow mb-10">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">🌟 Your Impact</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <ImpactCard label="Total Donations" value={totalDonations} />
            <ImpactCard label="Lives Impacted" value={totalDonations * 3} />
            <ImpactCard
              label="Badge"
              value={
                totalDonations >= 5 ? "🏆 Legend" :
                totalDonations >= 3 ? "🦸 Hero" :
                "❤️ Lifesaver"
              }
            />
          </div>
        </section>
      )}

      {/* ================= MAP ================= */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-3">Hospital Locations</h2>
        <MapContainer center={[17.385044, 78.486671]} zoom={12} style={{ height: "300px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {[...requests, acceptedRequest].filter(Boolean).map((r: Request) => (
            <Marker key={r.hospital.id} position={[r.hospital.lat, r.hospital.lng]}>
              <Popup>{r.hospital.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
    </div>
  );
};

/* ================= SMALL COMPONENTS ================= */
const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white text-blue-700 px-4 py-2 rounded shadow text-center min-w-[90px]">
    <p className="text-xs">{label}</p>
    <p className="font-bold">{value}</p>
  </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const ImpactCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white p-4 rounded shadow">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default DonorDashboard;
