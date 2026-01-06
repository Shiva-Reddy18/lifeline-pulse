// src/Volunteer/VolunteerStats.tsx
import { Card } from "@/components/ui/card";

interface Props {
  role: string;
  level: string;
  sos: number;
  pending: number;
  active: number;
  completed: number;
  livesSaved: number;
}

export default function VolunteerStats({
  role,
  level,
  sos,
  pending,
  active,
  completed,
  livesSaved,
}: Props) {
  const stats = [
    { label: "SOS", value: sos, color: "text-red-600" },
    { label: "Pending Requests", value: pending, color: "text-yellow-600" },
    { label: "Active Task", value: active, color: "text-blue-600" },
    { label: "Completed", value: completed, color: "text-green-600" },
    { label: "Lives Saved", value: livesSaved, color: "text-purple-600" },
  ];

  return (
    <Card className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white shadow-lg rounded-xl">
      {/* Role & Level */}
      <div className="flex flex-col justify-center items-start col-span-2 md:col-span-2 lg:col-span-1">
        <p className="text-gray-700 font-semibold text-sm md:text-base">
          {role} • {level}
        </p>
      </div>

      {/* Stats Cards */}
      {stats.map((s) => (
        <div
          key={s.label}
          className="text-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transform transition-all duration-300 hover:scale-[1.05]"
        >
          <p className={`font-bold text-lg md:text-xl ${s.color}`}>{s.value}</p>
          <p className="text-gray-500 text-xs md:text-sm">{s.label}</p>
        </div>
      ))}
    </Card>
  );
}
