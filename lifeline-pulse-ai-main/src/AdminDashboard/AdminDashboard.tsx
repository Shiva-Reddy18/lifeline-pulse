import { AdminStats } from "./components/AdminStats";
import { VerificationQueue } from "./components/VerificationQueue";
import { SystemActivity } from "./components/SystemActivity";
import { AdminActions } from "./components/AdminActions";

import { adminStats } from "./data/stats";
import { verificationQueue } from "./data/verification";
import { systemRequests } from "./data/requests";
import { AuditLogs } from "./components/AuditLogs";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Hardcoded admin credentials (as requested)
const ADMIN_EMAIL = "asamshiva@gmail.com";
const ADMIN_PASSWORD = "123456";


export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('admin_authenticated') === '1';
    } catch {
      return false;
    }
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) {
      setError(null);
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem('admin_authenticated', '1');
      } catch {}
      setAuthenticated(true);
      setError(null);
      try { window.dispatchEvent(new Event('admin-auth-changed')); } catch {}
    } else {
      setError('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('admin_authenticated');
    } catch {}
    setAuthenticated(false);
    setEmail('');
    setPassword('');
    try { window.dispatchEvent(new Event('admin-auth-changed')); } catch {}
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>
          <p className="text-sm text-muted-foreground mb-4">Enter admin credentials to access the Admin Command Center.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex items-center justify-between">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Sign in</button>
              <div className="text-xs text-muted-foreground">Contact dev for password changes</div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 md:px-10 
  bg-gradient-to-br from-red-50 via-white to-blue-50
  relative overflow-hidden">
      <div className="absolute right-6 top-6">
        <button onClick={handleLogout} className="text-sm text-muted-foreground hover:underline">Logout</button>
      </div>
{/* Background Effects */}
<div className="absolute inset-0 -z-10 overflow-hidden">
  <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-200/30 rounded-full blur-3xl" />
  <div className="absolute top-1/3 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl" />
</div>

      {/* Header */}
    <div className="mb-10">
  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight
    bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
    🛡️ Admin Command Center
  </h1>
  <p className="mt-2 text-muted-foreground max-w-2xl">
    Real-time monitoring, verification, and control of the Lifeline blood emergency network
  </p>
</div>


      {/* Live Stats */}
      <AdminStats />

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <VerificationQueue />
</motion.div>
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
  <SystemActivity />
</motion.div>
      </div>

      {/* Audit Logs */}
      <AuditLogs />
    </div>
  );
}

