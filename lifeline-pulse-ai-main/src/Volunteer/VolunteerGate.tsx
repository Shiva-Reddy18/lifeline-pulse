import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VolunteerGate({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, primaryRole, authReady } = useAuth();

  // ⏳ Wait ONLY for auth bootstrap
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <ShieldCheck className="h-8 w-8 text-green-600" />
          <p className="text-sm">Checking access…</p>
        </div>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ❌ Logged in but wrong role
  if (primaryRole !== "volunteer") {
    return <Navigate to="/" replace />;
  }

  // ✅ Access granted
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
