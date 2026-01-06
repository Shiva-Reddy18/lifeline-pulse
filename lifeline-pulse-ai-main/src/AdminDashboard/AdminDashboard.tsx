import { AdminStats } from "./components/AdminStats";
import { VerificationQueue } from "./components/VerificationQueue";
import { SystemActivity } from "./components/SystemActivity";
import { AdminActions } from "./components/AdminActions";

import { adminStats } from "./data/stats";
import { verificationQueue } from "./data/verification";
import { systemRequests } from "./data/requests";
import { AuditLogs } from "./components/AuditLogs";
import { motion } from "framer-motion";


export default function AdminDashboard() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-10 
  bg-gradient-to-br from-red-50 via-white to-blue-50
  relative overflow-hidden">
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

