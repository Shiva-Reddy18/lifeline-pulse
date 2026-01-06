// src/Volunteer/AvailabilityToggle.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  available: boolean;
  setAvailable: (v: boolean) => void;
}

export default function AvailabilityToggle({ available, setAvailable }: Props) {
  return (
    <Card className="p-4 flex justify-between items-center shadow-lg rounded-xl transform transition-all duration-500 hover:scale-[1.03] animate-fadeIn">
      <p className="font-semibold text-lg">
        Status:{" "}
        <span className={available ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
          {available ? "Available" : "Offline"}
        </span>
      </p>

      <Button
        className={`px-5 py-2 rounded-lg font-semibold transition-transform duration-300 transform hover:scale-105 shadow-md ${
          available
            ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
        }`}
        onClick={() => setAvailable(!available)}
      >
        {available ? "Go Offline" : "Go Online"}
      </Button>
    </Card>
  );
}
