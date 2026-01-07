import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getVolunteerForCurrentUser } from "./helpers";

export default function AvailabilityToggle() {
  const { user, primaryRole } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD STATUS ---------------- */
  useEffect(() => {
    const loadStatus = async () => {
      if (!user || primaryRole !== "volunteer") {
        setLoading(false);
        return;
      }

      try {
        const volunteer = await getVolunteerForCurrentUser(user.id);

        if (volunteer && typeof volunteer.is_online === "boolean") {
          setIsOnline(volunteer.is_online);
          localStorage.setItem(
            "volunteer_online",
            String(volunteer.is_online)
          );
          setLoading(false);
          return;
        }
      } catch {
        // ignore DB errors
      }

      // 🟡 fallback
      const local = localStorage.getItem("volunteer_online");
      setIsOnline(local === "true");
      setLoading(false);
    };

    loadStatus();
  }, [user, primaryRole]);

  /* ---------------- TOGGLE ---------------- */
  const toggle = async () => {
    const next = !isOnline;
    setIsOnline(next);
    localStorage.setItem("volunteer_online", String(next));

    window.dispatchEvent(
      new CustomEvent("deliveries-changed", { detail: { refresh: true } })
    );

    if (!user || primaryRole !== "volunteer") return;

    try {
      const volunteer = await getVolunteerForCurrentUser(user.id);
      if (!volunteer) return;

      await supabase
        .from("volunteers")
        .update({ is_online: next })
        .eq("id", volunteer.id);
    } catch {
      // demo-safe
    }
  };

  if (loading) return null;

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
        isOnline
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
      }`}
    >
      <Power className="h-4 w-4" />
      {isOnline ? "ONLINE" : "OFFLINE"}
    </motion.button>
  );
}
