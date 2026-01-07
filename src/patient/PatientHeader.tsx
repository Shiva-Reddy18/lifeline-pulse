import { useEffect, useState } from "react";
import { Home, Sparkles, Map, User, Menu, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ActiveView = "dashboard" | "profile" | "ai" | "map";

type Props = {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
};

export default function PatientHeader({
  activeView,
  setActiveView,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState<string>("");

  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error('Error signing out', e);
    }
  };

  /* 🔹 FETCH NAME FROM DB (robust to auth state changes) */
  useEffect(() => {
    let mounted = true;

    const fetchUserName = async () => {
      if (!mounted) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Try single() first, but fall back to first row if the DB unexpectedly returns multiple rows
      try {
        const res = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (!res.error && res.data?.full_name) {
          setName(res.data.full_name);
        }
      } catch (e) {
        console.warn("single() failed when fetching full_name; falling back to array fetch:", e);
        const { data: rows, error: rowsErr } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .limit(1);

        if (!rowsErr && Array.isArray(rows) && rows[0]?.full_name) {
          setName(rows[0].full_name);
        }
      }
    };

    // Initial attempt
    fetchUserName();

    // Subscribe to auth events (signed in/out) so we show name as soon as possible
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        fetchUserName();
      }

      if (event === "SIGNED_OUT") {
        setName("");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const navItem = (
    label: string,
    view: ActiveView,
    Icon: any
  ) => {
    const isActive = activeView === view;

    return (
      <button
        type="button"
        onClick={() => {
          setActiveView(view);
          setMobileOpen(false);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition
          ${
            isActive
              ? "bg-red-100 text-red-600"
              : "text-gray-600 hover:text-red-600"
          }`}
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
              {navItem("AI Lab", "ai", Sparkles)}
              {navItem("Network Map", "map", Map)}
              {navItem("Profile", "profile", User)}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6">

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>

            {/* ONLINE STATUS */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Online
            </div>

            {/* USER */}
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-sm font-medium">
                  {name || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Patient
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-semibold flex items-center justify-center">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Sign out button (desktop) */}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="ml-4 px-3 py-1 rounded-lg border text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      {mobileOpen && (
        <div className="md:hidden w-full bg-white border-b shadow-sm">
          <div className="px-6 py-4 flex flex-col gap-3">
            {navItem("Dashboard", "dashboard", Home)}
            {navItem("AI Lab", "ai", Sparkles)}
            {navItem("Network Map", "map", Map)}
            {navItem("Profile", "profile", User)}

            {user && (
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
