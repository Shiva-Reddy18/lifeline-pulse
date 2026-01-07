import { useEffect, useRef, useState } from "react";
import { Heart, User, LogOut, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import AvailabilityToggle from "./AvailabilityToggle";
import { useAuth } from "@/contexts/AuthContext";
import EditProfileModal from "./EditProfileModal";

export default function VolunteerHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /* ---------------- CLOSE ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- SIGN OUT ---------------- */
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-white shadow-sm">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">BloodConnect</h1>
            <p className="text-xs text-muted-foreground">
              Volunteer Dashboard
            </p>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-4">
          {/* ONLINE / OFFLINE */}
          <AvailabilityToggle />

          {/* PROFILE */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200 hover:bg-gray-200"
            >
              <User className="h-4 w-4 text-gray-700" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-sm font-medium text-gray-800 border-b">
                  {profile?.full_name ?? "Volunteer"}
                </div>

                <button
                  onClick={() => {
                    setEditOpen(true);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </motion.header>
  );
}
