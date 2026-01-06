import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/* -------------------- TYPES -------------------- */

type AppRole =
  | "patient"
  | "donor"
  | "hospital_staff"
  | "blood_bank"
  | "volunteer"
  | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  primaryRole: AppRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      phone?: string;
      blood_group?: string | null;
      selected_role: AppRole;
      address?: string;
    }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* -------------------- PROVIDER -------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- AUTH STATE SYNC ---------- */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          setProfile(null);
          setPrimaryRole(null);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data ?? null);
        setPrimaryRole((data?.primary_role as AppRole) ?? null);
      }
    );

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        setProfile(profileData ?? null);
        setPrimaryRole(
          (profileData?.primary_role as AppRole) ?? null
        );
      }

      setLoading(false);
    };

    loadSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ---------- SIGN UP ---------- */
  const signUp = async (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      phone?: string;
      blood_group?: string | null;
      selected_role: AppRole;
      address?: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) return { error };

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: data.user.id,
          full_name: metadata.full_name,
          email,
          phone: metadata.phone ?? null,
          blood_group: metadata.blood_group ?? null,
          address: metadata.address ?? null,
          primary_role: metadata.selected_role,
          role: metadata.selected_role,
          is_verified: metadata.selected_role === "patient",
        },
      ]);

    return { error: profileError };
  };

  /* ---------- SIGN IN ---------- */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /* ---------- SIGN OUT (FIXED) ---------- */
  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setProfile(null);
    setPrimaryRole(null);

    navigate("/login", { replace: true });
  };

  /* ---------- HELPERS ---------- */
  const hasRole = (role: AppRole) => primaryRole === role;

  const getDashboardPath = () => {
    if (!primaryRole) return "/login";

    switch (primaryRole) {
      case "patient":
        return "/dashboard/patient";
      case "donor":
        return "/dashboard/donor";
      case "hospital_staff":
        return "/hospital";
      case "blood_bank":
        return "/dashboard/blood-bank";
      case "volunteer":
        return "/dashboard/volunteer";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        primaryRole,
        loading,
        signUp,
        signIn,
        signOut,
        hasRole,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* -------------------- HOOK -------------------- */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
