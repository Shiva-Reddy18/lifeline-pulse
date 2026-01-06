import { useState } from "react";
import { Home, Sparkles, Map, User, Menu, X } from "lucide-react";

type Props = {
  activeView: "dashboard" | "profile";
  setActiveView: (v: "dashboard" | "profile") => void;
};

export default function PatientHeader({
  activeView,
  setActiveView,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItem = (
    label: string,
    view: "dashboard" | "profile",
    Icon: any
  ) => {
    const isActive = activeView === view;

    return (
      <button
        onClick={() => {
          setActiveView(view);
          setMobileOpen(false);
        }}
        className={`
          flex items-center gap-2
          px-3 py-2
          rounded-full
          text-sm font-medium
          transition
          w-full md:w-auto
          justify-center md:justify-start
          ${
            isActive
              ? "bg-red-100 text-red-600"
              : "text-gray-600 hover:text-red-600"
          }
        `}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  return (
    <>
      {/* HEADER */}
      <header className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-semibold text-lg">
              ❤️ <span>Lifeline</span>
            </div>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-6">
              {navItem("Dashboard", "dashboard", Home)}
              {navItem("AI Lab", "dashboard", Sparkles)}
              {navItem("Network Map", "dashboard", Map)}
              {navItem("Profile", "profile", User)}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>

            {/* Online status */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Online
            </div>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-sm font-medium">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>

              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-semibold flex items-center justify-center">
                S
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      {mobileOpen && (
        <div className="md:hidden w-full bg-white border-b shadow-sm">
          <div className="px-6 py-4 flex flex-col gap-3">
            {navItem("Dashboard", "dashboard", Home)}
            {navItem("AI Lab", "dashboard", Sparkles)}
            {navItem("Network Map", "dashboard", Map)}
            {navItem("Profile", "profile", User)}
          </div>
        </div>
      )}
    </>
  );
}
