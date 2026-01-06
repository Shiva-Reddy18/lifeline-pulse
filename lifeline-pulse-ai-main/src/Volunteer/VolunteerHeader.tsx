import { Card } from "@/components/ui/card";

interface Props {
  role: string;
  level: string;
  sos: number;
}

export default function VolunteerHeader({ role, level, sos }: Props) {
  return (
    <Card className="p-6 flex justify-between items-center bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg rounded-xl">
      <div>
        <p className="text-lg font-semibold">
          Role: {role} • Level: {level}
        </p>
      </div>
      <div>
        <p className="font-bold text-2xl">SOS {sos}</p>
      </div>
    </Card>
  );
}
