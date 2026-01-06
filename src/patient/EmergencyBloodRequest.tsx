import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function EmergencyBloodRequest() {
  return (
    <Card className="relative border-none overflow-hidden min-h-[320px]">
      {/* soft background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 space-y-6">

        {/* title */}
        <h2 className="text-lg font-medium text-gray-700">
          Emergency Blood Request
        </h2>

        {/* SOS */}
        <div className="relative">

          {/* blinking ring */}
          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-40" />

          {/* glow */}
          <div className="absolute inset-0 rounded-full bg-red-400 blur-2xl opacity-30 animate-pulse" />

          {/* button */}
          <button
            className="
              relative
              w-24 h-24
              rounded-full
              bg-red-600
              flex flex-col
              items-center
              justify-center
              text-white
              shadow-xl
              animate-[heartbeat_1.4s_ease-in-out_infinite]
            "
          >
            <AlertCircle className="w-7 h-7 mb-1" />
            <span className="text-sm font-semibold">SOS</span>
          </button>
        </div>

        {/* description */}
        <p className="text-sm text-gray-500 max-w-xs">
          Tap for urgent blood requests. Help is nearby.
        </p>
      </div>
    </Card>
  );
}
