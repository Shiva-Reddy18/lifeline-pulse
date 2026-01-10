import { NavLink, Outlet } from "react-router-dom";
import {
  Users,
  Droplet,
  Building2,
  Shield,
} from "lucide-react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-blue-200 shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Admin Panel
          </h2>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink
            to="/dashboard/admin/patients"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
              }`
            }
          >
            <Users className="w-5 h-5" />
            Patients
          </NavLink>

          <NavLink
            to="/dashboard/admin/donors"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
              }`
            }
          >
            <Droplet className="w-5 h-5" />
            Donors
          </NavLink>

          <NavLink
            to="/dashboard/admin/hospitals"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              }`
            }
          >
            <Building2 className="w-5 h-5" />
            Hospitals
          </NavLink>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
