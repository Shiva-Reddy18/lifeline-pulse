import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* ==================== TYPES ==================== */

export type AppRole =
  | "patient"
  | "donor"
  | "hospital_staff"
  | "blood_bank"
  | "volunteer"
  | "admin";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  blood_group?: string | null;
  address?: string | null;
  primary_role: AppRole | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  primaryRole: AppRole | null;

  loading: boolean;
  authReady: boolean;

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

  refreshProfile: () => Promise<void>; // ✅ IMPORTANT
  hasRole: (role: AppRole) => boolean;
  getDashboardPath: () => string;
}

/* ==================== CONTEXT ==================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ==================== PROVIDER ==================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  /* ---------- LOAD PROFILE ---------- */
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    if (error || !data) {
      setProfile(null);
      setPrimaryRole(null);
      return;
    }

    setProfile(data);
    setPrimaryRole(data.primary_role);
  };

  /* ---------- REFRESH PROFILE (🔥 FIX) ---------- */
  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user.id);
  };

  /* ---------- INIT AUTH ---------- */
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
      setAuthReady(true);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setPrimaryRole(null);
      }

      setLoading(false);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
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

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: metadata.full_name,
      phone: metadata.phone ?? null,
      blood_group: metadata.blood_group ?? null,
      primary_role: metadata.selected_role,
      address: metadata.address ?? null,
    });

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

  /* ---------- SIGN OUT (🔥 FIX) ---------- */
  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setSession(null);
    setProfile(null);
    setPrimaryRole(null);
    setAuthReady(true);

    window.location.href = "/auth"; // ✅ HARD REDIRECT
  };

  /* ---------- HELPERS ---------- */
  const hasRole = (role: AppRole) => primaryRole === role;

  const getDashboardPath = (): string => {
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
        return "/auth";
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
        authReady,
        signUp,
        signIn,
        signOut,
        refreshProfile, // ✅ EXPOSED
        hasRole,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ==================== HOOK ==================== */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
