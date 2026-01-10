import { NavLink, Outlet } from "react-router-dom";
import { Droplet, LayoutDashboard, Package, Truck } from "lucide-react";

export default function BloodBankLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Light Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b">
          <Droplet className="text-red-600" />
          <span className="text-lg font-bold text-gray-800">Blood Bank</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: "Overview", path: "", icon: <LayoutDashboard size={18} /> },
            { name: "Inventory", path: "inventory", icon: <Package size={18} /> },
            { name: "Hospital Requests", path: "requests", icon: <Droplet size={18} /> },
            { name: "Deliveries", path: "deliveries", icon: <Truck size={18} /> },
          ].map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
