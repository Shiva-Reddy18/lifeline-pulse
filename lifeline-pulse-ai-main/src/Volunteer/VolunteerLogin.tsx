import { useState } from "react";
import { HeartPulse, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function VolunteerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const login = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    setLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome!",
      description: "Logged in as volunteer",
    });

    // ✅ CORRECT ROUTE
    navigate("/dashboard/volunteer", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.12)] p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white shadow-md">
            <HeartPulse className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">
            BloodLink
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Volunteer Transport Portal
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="volunteer@bloodlink.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border px-10 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-10 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Login Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={login}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </motion.button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Saving lives, one delivery at a time ❤️
        </p>
      </motion.div>
    </div>
  );
}
