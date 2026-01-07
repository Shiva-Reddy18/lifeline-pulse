import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

/* ---------------- Animated Counter ---------------- */
function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = start + (end - start) * progress;
      setDisplay(Number(current.toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, decimals]);

  return <span>{display}</span>;
}

/* ---------------- Volunteer Stats ---------------- */
export default function VolunteerStats() {
  // ✅ SAFE LOCAL STATE (NO BACKEND DEPENDENCY)
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [onTimeRate, setOnTimeRate] = useState(0);
  const [rating, setRating] = useState(0);

  // ✅ Load once – NEVER blocks render
  useEffect(() => {
    // Demo values (replace with backend later)
    setTotalDeliveries(14);
    setOnTimeRate(93);
    setRating(4.7);
  }, []);

  const stats = [
    {
      icon: <Truck className="h-6 w-6 text-blue-600" />,
      value: totalDeliveries,
      label: "Total Deliveries",
      gradient: "from-blue-500/15 to-blue-500/5",
      decimals: 0,
    },
    {
      icon: <Clock className="h-6 w-6 text-green-600" />,
      value: onTimeRate,
      suffix: "%",
      label: "On-Time Rate",
      gradient: "from-green-500/15 to-green-500/5",
      decimals: 0,
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      value: rating,
      label: "Rating",
      gradient: "from-yellow-400/20 to-yellow-400/5",
      decimals: 1, // ⭐ FIX
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="relative overflow-hidden rounded-3xl border shadow-sm hover:shadow-md transition">
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${s.gradient} pointer-events-none`}
            />

            <CardContent className="relative p-6">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                {s.icon}
              </div>

              <div className="mt-6">
                <h2 className="text-4xl font-extrabold text-gray-900">
                  <AnimatedNumber
                    value={s.value}
                    decimals={s.decimals}
                  />
                  {s.suffix ?? ""}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
