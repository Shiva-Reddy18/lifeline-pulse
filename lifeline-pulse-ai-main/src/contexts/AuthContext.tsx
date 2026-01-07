import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole =
  | 'patient'
  | 'donor'
  | 'hospital_staff'
  | 'blood_bank'
  | 'volunteer'
  | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasRole = (role: string) => {
  return user?.role === role;
};
const getDashboardPath = () => {
  if (!user) return "/auth";

  switch (user.role) {
    case "patient":
      return "/dashboard/patient";
    case "donor":
      return "/dashboard/donor";
    case "hospital":
      return "/hospital";
    case "admin":
      return "/dashboard/admin";
    case "blood-bank":
      return "/dashboard/blood-bank";
    case "volunteer":
      return "/dashboard/volunteer";
    default:
      return "/";
  }
};

  // ✅ REPLACED EFFECT (EXACT VERSION YOU GAVE)
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setProfile(data);
        } else {
          setProfile(null);
        }
      });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        setProfile(profileData);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hardcoded admin credentials (must match AdminDashboard)
  const ADMIN_EMAIL = 'asamshiva@gmail.com';
  const ADMIN_PASSWORD = '123456';

  const signUp = async (
    email: string,
    password: string,
    metadata?: {
      full_name?: string;
      phone?: string;
      blood_group?: string | null;
      address?: string;
      selected_role?: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return { error };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: metadata?.full_name,
        email,
        phone: metadata?.phone,
        blood_group: metadata?.blood_group ?? null,
        address: metadata?.address ?? null,
        primary_role: metadata?.selected_role,
        role: metadata?.selected_role,
        is_verified: metadata?.selected_role === 'patient',
      });

    if (profileError) {
      console.error('Profile insert error:', profileError);
      return { error: profileError };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Accept hardcoded admin credentials locally (no Supabase)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem('admin_authenticated', '1');
      } catch {}

      // synthetic user + profile for admin
      const adminUser: any = { id: 'admin-local', email, role: 'admin' };
      const adminProfile = {
        id: 'admin-local',
        email,
        full_name: 'Administrator',
        primary_role: 'admin',
        role: 'admin',
        is_verified: true,
      };

      setUser(adminUser as any);
      setSession(null);
      setProfile(adminProfile);

      try { window.dispatchEvent(new Event('admin-auth-changed')); } catch {}

      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // If admin was signed in via local hardcoded flow, clear that first
    try {
      if (sessionStorage.getItem('admin_authenticated') === '1') {
        sessionStorage.removeItem('admin_authenticated');
        setUser(null);
        setSession(null);
        setProfile(null);
        try { window.dispatchEvent(new Event('admin-auth-changed')); } catch {}
        return;
      }
    } catch {}

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    try { window.dispatchEvent(new Event('admin-auth-changed')); } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        hasRole,
         getDashboardPath
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
