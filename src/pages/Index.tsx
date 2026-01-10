import { motion } from "framer-motion";
import {
  Heart,
  Shield,
  MapPin,
  Phone,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B132B] text-white overflow-hidden">

      {/* ================= HERO SECTION ================= */}
      <section className="relative py-32 px-6">
        {/* Ambient gradient lights */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-500/20 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] bg-orange-500/20 rounded-full blur-[160px]" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          <motion.h1
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight"
          >
            Every Second{" "}
            <span className="text-orange-400">Matters</span>
            <br />
            Emergency Blood,{" "}
            <span className="text-blue-400">Delivered Faster</span>
          </motion.h1>

          <p className="mt-6 max-w-3xl mx-auto text-white/80 text-lg">
            A hospital-controlled emergency blood coordination platform
            designed to function under pressure — even during low or no network.
          </p>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="mt-12 px-14 py-4 rounded-xl font-bold bg-orange-500 text-white shadow-2xl shadow-orange-500/30"
            onClick={() => navigate("/auth?role=patient")}
          >
            Request Emergency Blood
          </motion.button>

          {/* Trust metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24">
            {[
              ["2–10 min", "Donor Discovery"],
              ["24/7", "System Availability"],
              ["Verified", "Hospital Controlled"],
              ["Offline Ready", "Low Network Support"],
            ].map(([value, label], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6"
              >
                <div className="text-3xl font-bold text-blue-400">
                  {value}
                </div>
                <div className="text-sm text-white/80 mt-1">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ================= WHY THIS PLATFORM ================= */}
      <section className="py-24 bg-white text-[#0B132B]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold">Why This Platform Exists</h2>
            <p className="mt-3 text-slate-600">
              Designed for real emergencies — not demos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Shield,
                title: "Hospital-First Architecture",
                desc: "Every emergency request is verified and coordinated through hospitals.",
              },
              {
                icon: Zap,
                title: "Ultra-Fast Response",
                desc: "Minimal steps to reduce delay during life-critical moments.",
              },
              {
                icon: MapPin,
                title: "Smart Location Routing",
                desc: "Automatically connects nearest donors and hospitals.",
              },
              {
                icon: CheckCircle,
                title: "Disaster-Ready",
                desc: "Functions even when internet connectivity fails.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-5 p-6 bg-white rounded-xl shadow-xl"
              >
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <item.icon className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-slate-600 text-sm mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-24 bg-[#1C2541] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold">Built for Critical Situations</h2>
            <p className="text-white/70 mt-3">
              Emergency coordination designed for hospitals and responders.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Emergency Request Flow",
                desc: "Designed for speed and clarity.",
              },
              {
                icon: Shield,
                title: "Verified Hospitals",
                desc: "Only authorized hospitals manage coordination.",
              },
              {
                icon: MapPin,
                title: "Auto Location",
                desc: "Live + cached routing intelligence.",
              },
              {
                icon: Phone,
                title: "Low Network Mode",
                desc: "Reliable even in rural or disaster zones.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <f.icon className="text-blue-400" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-white/70 mt-2">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-28 bg-gradient-to-r from-[#0B132B] to-[#1C2541] text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold"
        >
          Designed to Save Time.
          <br />
          Built to Save Lives.
        </motion.h2>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="mt-12 px-16 py-4 rounded-xl font-bold bg-orange-500 text-white shadow-2xl shadow-orange-500/40"
          onClick={() => navigate("/auth?role=patient")}
        >
          Start Emergency Request
        </motion.button>
      </section>
    </div>
  );
}